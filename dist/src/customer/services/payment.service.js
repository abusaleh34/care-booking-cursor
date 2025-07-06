"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stripe_1 = require("stripe");
const booking_entity_1 = require("../../database/entities/booking.entity");
const audit_service_1 = require("../../auth/services/audit.service");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(bookingRepository, configService, auditService, realtimeGateway) {
        this.bookingRepository = bookingRepository;
        this.configService = configService;
        this.auditService = auditService;
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger(PaymentService_1.name);
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        this.stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2025-05-28.basil',
        });
        this.commissionRate = this.configService.get('PLATFORM_COMMISSION_RATE', 0.1);
    }
    async processPayment(customerId, paymentDto, ipAddress, userAgent) {
        const { bookingId, paymentMethodId, tipAmount = 0 } = paymentDto;
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, customerId },
            relations: ['service', 'provider'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending bookings can be paid for');
        }
        const serviceAmount = Number(booking.totalAmount);
        const totalAmount = serviceAmount + tipAmount;
        const platformCommission = this.calculateCommission(serviceAmount);
        const providerAmount = serviceAmount - platformCommission + tipAmount;
        try {
            const paymentIntentData = {
                amount: Math.round(totalAmount * 100),
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
                application_fee_amount: Math.round(platformCommission * 100),
            };
            const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);
            if (paymentIntent.status === 'succeeded') {
                await this.bookingRepository.update(bookingId, {
                    status: booking_entity_1.BookingStatus.CONFIRMED,
                    totalAmount: totalAmount,
                });
                await this.auditService.log({
                    userId: customerId,
                    action: audit_log_entity_1.AuditAction.REGISTER,
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
                let receiptUrl;
                if (paymentIntent.latest_charge) {
                    const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge);
                    receiptUrl = charge.receipt_url || undefined;
                }
                const paymentData = {
                    paymentIntentId: paymentIntent.id,
                    amount: totalAmount,
                    platformCommission,
                    providerAmount,
                    receiptUrl,
                };
                this.realtimeGateway.notifyPaymentConfirmed(bookingId, customerId, booking.provider.userId, paymentData);
                this.realtimeGateway.notifyBookingStatusChange(bookingId, booking_entity_1.BookingStatus.CONFIRMED, customerId, booking.provider.userId);
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
                        status: booking_entity_1.BookingStatus.CONFIRMED,
                        totalAmount,
                    },
                };
            }
            else if (paymentIntent.status === 'requires_action') {
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
            }
            else {
                throw new common_1.BadRequestException('Payment failed');
            }
        }
        catch (error) {
            this.logger.error(`Payment processing failed for booking ${bookingId}:`, error);
            if (error instanceof stripe_1.default.errors.StripeError) {
                throw new common_1.BadRequestException(`Payment failed: ${error.message}`);
            }
            throw new common_1.InternalServerErrorException('Payment processing failed');
        }
    }
    async confirmPayment(customerId, paymentIntentId, ipAddress, userAgent) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (!paymentIntent.metadata.booking_id) {
                throw new common_1.BadRequestException('Invalid payment intent');
            }
            const bookingId = paymentIntent.metadata.booking_id;
            const booking = await this.bookingRepository.findOne({
                where: { id: bookingId, customerId },
                relations: ['service', 'provider'],
            });
            if (!booking) {
                throw new common_1.NotFoundException('Booking not found');
            }
            if (paymentIntent.status === 'succeeded') {
                await this.bookingRepository.update(bookingId, {
                    status: booking_entity_1.BookingStatus.CONFIRMED,
                });
                await this.auditService.log({
                    userId: customerId,
                    action: audit_log_entity_1.AuditAction.REGISTER,
                    description: `Payment confirmed for booking ${bookingId}`,
                    ipAddress,
                    userAgent,
                    metadata: {
                        bookingId,
                        paymentIntentId,
                    },
                });
                let receiptUrl;
                if (paymentIntent.latest_charge) {
                    const charge = await this.stripe.charges.retrieve(paymentIntent.latest_charge);
                    receiptUrl = charge.receipt_url || undefined;
                }
                const paymentData = {
                    paymentIntentId,
                    amount: Number(paymentIntent.metadata.service_amount) +
                        Number(paymentIntent.metadata.tip_amount),
                    platformCommission: Number(paymentIntent.metadata.platform_commission),
                    providerAmount: Number(paymentIntent.metadata.provider_amount),
                    receiptUrl,
                };
                this.realtimeGateway.notifyPaymentConfirmed(bookingId, customerId, booking.provider.userId, paymentData);
                this.realtimeGateway.notifyBookingStatusChange(bookingId, booking_entity_1.BookingStatus.CONFIRMED, customerId, booking.provider.userId);
                return {
                    success: true,
                    paymentIntentId,
                    amount: Number(paymentIntent.metadata.service_amount) +
                        Number(paymentIntent.metadata.tip_amount),
                    platformCommission: Number(paymentIntent.metadata.platform_commission),
                    providerAmount: Number(paymentIntent.metadata.provider_amount),
                    receiptUrl,
                    booking: {
                        id: booking.id,
                        status: booking_entity_1.BookingStatus.CONFIRMED,
                        totalAmount: booking.totalAmount,
                    },
                };
            }
            else {
                throw new common_1.BadRequestException('Payment not completed');
            }
        }
        catch (error) {
            this.logger.error(`Payment confirmation failed:`, error);
            throw new common_1.InternalServerErrorException('Payment confirmation failed');
        }
    }
    async processRefund(bookingId, customerId, reason, ipAddress, userAgent) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, customerId },
            relations: ['service', 'provider'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.CONFIRMED && booking.status !== booking_entity_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Only confirmed or cancelled bookings can be refunded');
        }
        try {
            const paymentIntents = await this.stripe.paymentIntents.list({
                limit: 10,
            });
            const paymentIntent = paymentIntents.data.find((pi) => pi.metadata.booking_id === bookingId && pi.status === 'succeeded');
            if (!paymentIntent) {
                throw new common_1.NotFoundException('Payment not found for this booking');
            }
            const refundAmount = this.calculateRefundAmount(booking, paymentIntent);
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntent.id,
                amount: Math.round(refundAmount * 100),
                reason: 'requested_by_customer',
                metadata: {
                    booking_id: bookingId,
                    refund_reason: reason,
                },
            });
            await this.bookingRepository.update(bookingId, {
                status: booking_entity_1.BookingStatus.CANCELLED,
            });
            await this.auditService.log({
                userId: customerId,
                action: audit_log_entity_1.AuditAction.REGISTER,
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
            this.realtimeGateway.notifyBookingStatusChange(bookingId, booking_entity_1.BookingStatus.CANCELLED, customerId, booking.provider.userId);
            return {
                success: true,
                refundId: refund.id,
                amount: refundAmount,
                status: refund.status,
                booking: {
                    id: booking.id,
                    status: booking_entity_1.BookingStatus.CANCELLED,
                },
            };
        }
        catch (error) {
            this.logger.error(`Refund processing failed for booking ${bookingId}:`, error);
            if (error instanceof stripe_1.default.errors.StripeError) {
                throw new common_1.BadRequestException(`Refund failed: ${error.message}`);
            }
            throw new common_1.InternalServerErrorException('Refund processing failed');
        }
    }
    async handleWebhook(signature, payload) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (error) {
            this.logger.error('Webhook signature verification failed:', error);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailed(event.data.object);
                break;
            case 'refund.created':
                await this.handleRefundCreated(event.data.object);
                break;
            default:
                this.logger.log(`Unhandled webhook event type: ${event.type}`);
        }
    }
    calculateCommission(serviceAmount) {
        return Math.round(serviceAmount * this.commissionRate * 100) / 100;
    }
    calculateRefundAmount(booking, paymentIntent) {
        const totalPaid = paymentIntent.amount / 100;
        const now = new Date();
        const bookingDateTime = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilBooking > 24) {
            return totalPaid;
        }
        else if (hoursUntilBooking > 2) {
            return totalPaid * 0.75;
        }
        else {
            return totalPaid * 0.5;
        }
    }
    async handlePaymentSucceeded(paymentIntent) {
        const bookingId = paymentIntent.metadata.booking_id;
        if (!bookingId)
            return;
        await this.bookingRepository.update(bookingId, {
            status: booking_entity_1.BookingStatus.CONFIRMED,
        });
        this.logger.log(`Payment succeeded for booking ${bookingId}`);
    }
    async handlePaymentFailed(paymentIntent) {
        const bookingId = paymentIntent.metadata.booking_id;
        if (!bookingId)
            return;
        this.logger.warn(`Payment failed for booking ${bookingId}`);
    }
    async handleRefundCreated(refund) {
        const bookingId = refund.metadata?.booking_id;
        if (!bookingId)
            return;
        this.logger.log(`Refund created for booking ${bookingId}: ${refund.id}`);
    }
    async sendPaymentConfirmationEmails(booking, paymentDetails) {
        this.logger.log(`Sending payment confirmation emails for booking ${booking.id}`);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        audit_service_1.AuditService,
        websocket_gateway_1.RealtimeGateway])
], PaymentService);
//# sourceMappingURL=payment.service.js.map