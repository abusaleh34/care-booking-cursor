import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { PaymentDto } from '../dto/create-booking.dto';
import { AuditService } from '../../auth/services/audit.service';
import { AuditAction } from '../../database/entities/audit-log.entity';
import { RealtimeGateway } from '../../websocket/websocket.gateway';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  amount: number;
  platformCommission: number;
  providerAmount: number;
  receiptUrl?: string;
  booking: {
    id: string;
    status: BookingStatus;
    totalAmount: number;
  };
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  booking: {
    id: string;
    status: BookingStatus;
  };
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;
  private readonly commissionRate: number;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });

    this.commissionRate = this.configService.get<number>('PLATFORM_COMMISSION_RATE', 0.1);
  }

  async processPayment(
    customerId: string,
    paymentDto: PaymentDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PaymentResult> {
    const { bookingId, paymentMethodId, tipAmount = 0 } = paymentDto;

    // Get booking details
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId },
      relations: ['service', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be paid for');
    }

    // Calculate amounts
    const serviceAmount = Number(booking.totalAmount);
    const totalAmount = serviceAmount + tipAmount;
    const platformCommission = this.calculateCommission(serviceAmount);
    const providerAmount = serviceAmount - platformCommission + tipAmount;

    try {
      // Create payment intent
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${this.configService.get('FRONTEND_URL')}/booking-confirmation`,
        metadata: {
          booking_id: bookingId,
          customer_id: customerId,
          provider_id: booking.providerId,
          service_amount: serviceAmount.toString(),
          tip_amount: tipAmount.toString(),
          platform_commission: platformCommission.toString(),
          provider_amount: providerAmount.toString(),
        },
        application_fee_amount: Math.round(platformCommission * 100), // Platform commission
      };

      // Only add transfer_data if provider has a Stripe account
      // For now, we'll skip this and handle direct payments
      // if (booking.provider?.stripeAccountId) {
      //   paymentIntentData.transfer_data = {
      //     destination: booking.provider.stripeAccountId,
      //   };
      // }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      // Handle payment result
      if (paymentIntent.status === 'succeeded') {
        // Update booking status
        await this.bookingRepository.update(bookingId, {
          status: BookingStatus.CONFIRMED,
          totalAmount: totalAmount,
        });

        // Log payment
        await this.auditService.log({
          userId: customerId,
          action: AuditAction.REGISTER, // Could add PAYMENT_PROCESSED action
          description: `Payment processed for booking ${bookingId}`,
          ipAddress,
          userAgent,
          metadata: {
            bookingId,
            paymentIntentId: paymentIntent.id,
            amount: totalAmount,
            platformCommission,
            providerAmount,
          },
        });

        // Get receipt URL from the first charge if available
        let receiptUrl: string | undefined;
        if (paymentIntent.latest_charge) {
          const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge as string);
          receiptUrl = charge.receipt_url || undefined;
        }

        const paymentData = {
          paymentIntentId: paymentIntent.id,
          amount: totalAmount,
          platformCommission,
          providerAmount,
          receiptUrl,
        };

        // Send WebSocket notifications
        this.realtimeGateway.notifyPaymentConfirmed(
          bookingId,
          customerId,
          booking.provider.userId,
          paymentData,
        );

        // Notify booking status change
        this.realtimeGateway.notifyBookingStatusChange(
          bookingId,
          BookingStatus.CONFIRMED,
          customerId,
          booking.provider.userId,
        );

        // Send confirmation emails (implementation depends on your email service)
        await this.sendPaymentConfirmationEmails(booking, {
          paymentIntentId: paymentIntent.id,
          totalAmount,
          platformCommission,
          providerAmount,
        });

        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: totalAmount,
          platformCommission,
          providerAmount,
          receiptUrl,
          booking: {
            id: booking.id,
            status: BookingStatus.CONFIRMED,
            totalAmount,
          },
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: totalAmount,
          platformCommission,
          providerAmount,
          booking: {
            id: booking.id,
            status: booking.status,
            totalAmount: booking.totalAmount,
          },
        };
      } else {
        throw new BadRequestException('Payment failed');
      }
    } catch (error) {
      this.logger.error(`Payment processing failed for booking ${bookingId}:`, error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Payment failed: ${error.message}`);
      }

      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  async confirmPayment(
    customerId: string,
    paymentIntentId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent.metadata.booking_id) {
        throw new BadRequestException('Invalid payment intent');
      }

      const bookingId = paymentIntent.metadata.booking_id;
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId, customerId },
        relations: ['service', 'provider'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (paymentIntent.status === 'succeeded') {
        await this.bookingRepository.update(bookingId, {
          status: BookingStatus.CONFIRMED,
        });

        await this.auditService.log({
          userId: customerId,
          action: AuditAction.REGISTER,
          description: `Payment confirmed for booking ${bookingId}`,
          ipAddress,
          userAgent,
          metadata: {
            bookingId,
            paymentIntentId,
          },
        });

        // Get receipt URL from the first charge if available
        let receiptUrl: string | undefined;
        if (paymentIntent.latest_charge) {
          const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge as string);
          receiptUrl = charge.receipt_url || undefined;
        }

        const paymentData = {
          paymentIntentId,
          amount:
            Number(paymentIntent.metadata.service_amount) +
            Number(paymentIntent.metadata.tip_amount),
          platformCommission: Number(paymentIntent.metadata.platform_commission),
          providerAmount: Number(paymentIntent.metadata.provider_amount),
          receiptUrl,
        };

        // Send WebSocket notifications
        this.realtimeGateway.notifyPaymentConfirmed(
          bookingId,
          customerId,
          booking.provider.userId,
          paymentData,
        );

        // Notify booking status change
        this.realtimeGateway.notifyBookingStatusChange(
          bookingId,
          BookingStatus.CONFIRMED,
          customerId,
          booking.provider.userId,
        );

        return {
          success: true,
          paymentIntentId,
          amount:
            Number(paymentIntent.metadata.service_amount) +
            Number(paymentIntent.metadata.tip_amount),
          platformCommission: Number(paymentIntent.metadata.platform_commission),
          providerAmount: Number(paymentIntent.metadata.provider_amount),
          receiptUrl,
          booking: {
            id: booking.id,
            status: BookingStatus.CONFIRMED,
            totalAmount: booking.totalAmount,
          },
        };
      } else {
        throw new BadRequestException('Payment not completed');
      }
    } catch (error) {
      this.logger.error(`Payment confirmation failed:`, error);
      throw new InternalServerErrorException('Payment confirmation failed');
    }
  }

  async processRefund(
    bookingId: string,
    customerId: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<RefundResult> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId },
      relations: ['service', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.CANCELLED) {
      throw new BadRequestException('Only confirmed or cancelled bookings can be refunded');
    }

    try {
      // Find the payment intent from Stripe
      const paymentIntents = await this.stripe.paymentIntents.list({
        limit: 10,
      });

      const paymentIntent = paymentIntents.data.find(
        (pi) => pi.metadata.booking_id === bookingId && pi.status === 'succeeded',
      );

      if (!paymentIntent) {
        throw new NotFoundException('Payment not found for this booking');
      }

      // Calculate refund amount (could be partial based on business rules)
      const refundAmount = this.calculateRefundAmount(booking, paymentIntent);

      // Process refund
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntent.id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          booking_id: bookingId,
          refund_reason: reason,
        },
      });

      // Update booking status
      await this.bookingRepository.update(bookingId, {
        status: BookingStatus.CANCELLED,
      });

      // Log refund
      await this.auditService.log({
        userId: customerId,
        action: AuditAction.REGISTER,
        description: `Refund processed for booking ${bookingId}`,
        ipAddress,
        userAgent,
        metadata: {
          bookingId,
          refundId: refund.id,
          refundAmount,
          reason,
        },
      });

      // Send WebSocket notifications
      this.realtimeGateway.notifyBookingStatusChange(
        bookingId,
        BookingStatus.CANCELLED,
        customerId,
        booking.provider.userId,
      );

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status,
        booking: {
          id: booking.id,
          status: BookingStatus.CANCELLED,
        },
      };
    } catch (error) {
      this.logger.error(`Refund processing failed for booking ${bookingId}:`, error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Refund failed: ${error.message}`);
      }

      throw new InternalServerErrorException('Refund processing failed');
    }
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'refund.created':
        await this.handleRefundCreated(event.data.object as Stripe.Refund);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private calculateCommission(serviceAmount: number): number {
    return Math.round(serviceAmount * this.commissionRate * 100) / 100;
  }

  private calculateRefundAmount(booking: Booking, paymentIntent: Stripe.PaymentIntent): number {
    // Business logic for refund calculation
    // For now, return full amount, but this could be adjusted based on timing, etc.
    const totalPaid = paymentIntent.amount / 100; // Convert from cents

    // Could implement time-based refund policies here
    const now = new Date();
    const bookingDateTime = new Date(
      `${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`,
    );
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking > 24) {
      return totalPaid; // Full refund
    } else if (hoursUntilBooking > 2) {
      return totalPaid * 0.75; // 75% refund
    } else {
      return totalPaid * 0.5; // 50% refund
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.booking_id;
    if (!bookingId) return;

    await this.bookingRepository.update(bookingId, {
      status: BookingStatus.CONFIRMED,
    });

    this.logger.log(`Payment succeeded for booking ${bookingId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const bookingId = paymentIntent.metadata.booking_id;
    if (!bookingId) return;

    // Could implement retry logic or notifications here
    this.logger.warn(`Payment failed for booking ${bookingId}`);
  }

  private async handleRefundCreated(refund: Stripe.Refund): Promise<void> {
    const bookingId = refund.metadata?.booking_id;
    if (!bookingId) return;

    this.logger.log(`Refund created for booking ${bookingId}: ${refund.id}`);
  }

  private async sendPaymentConfirmationEmails(
    booking: Booking,
    paymentDetails: {
      paymentIntentId: string;
      totalAmount: number;
      platformCommission: number;
      providerAmount: number;
    },
  ): Promise<void> {
    // Implementation would depend on your email service
    // This is a placeholder for the confirmation email logic
    this.logger.log(`Sending payment confirmation emails for booking ${booking.id}`);

    // TODO: Implement email sending to customer and provider
    // - Customer: Payment receipt and booking confirmation
    // - Provider: New booking notification with payout information
  }
}
