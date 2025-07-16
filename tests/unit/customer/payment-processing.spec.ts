import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from '../../../src/customer/services/payment.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

vi.mock('stripe');

describe('Customer Payment Service - Stripe Integration', () => {
  let service: PaymentService;
  let bookingRepository;
  let stripe;
  let configService;

  const mockBooking = {
    id: 'booking-123',
    customer: { 
      id: 'customer-123',
      email: 'customer@example.com',
      profile: { firstName: 'John', lastName: 'Doe' }
    },
    provider: { 
      id: 'provider-123',
      stripeAccountId: 'acct_provider123',
      businessName: 'Sarah\'s Wellness'
    },
    service: {
      id: 'service-123',
      name: 'Full Body Massage',
      price: 120,
    },
    totalAmount: 120,
    status: BookingStatus.PENDING,
    bookingDate: new Date('2025-06-15'),
    startTime: '10:00',
  };

  beforeEach(async () => {
    const mockBookingRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config = {
          STRIPE_SECRET_KEY: 'sk_test_123',
          STRIPE_WEBHOOK_SECRET: 'whsec_test123',
          STRIPE_PLATFORM_FEE_PERCENTAGE: '10',
          FRONTEND_URL: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    const mockStripe = {
      paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
        confirm: vi.fn(),
        cancel: vi.fn(),
      },
      refunds: {
        create: vi.fn(),
      },
      charges: {
        list: vi.fn(),
      },
      webhookEndpoints: {
        create: vi.fn(),
      },
      accounts: {
        retrieve: vi.fn(),
      },
      transfers: {
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepository },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: 'STRIPE_CLIENT',
          useValue: mockStripe,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    configService = module.get<ConfigService>(ConfigService);
    stripe = module.get('STRIPE_CLIENT');

    // Mock Stripe constructor
    vi.mocked(Stripe).mockImplementation(() => mockStripe as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with platform fee', async () => {
      const paymentDto = {
        bookingId: 'booking-123',
        paymentMethodId: 'pm_card_visa',
        tipAmount: 10,
      };

      bookingRepository.findOne.mockResolvedValue(mockBooking);

      const mockPaymentIntent = {
        id: 'pi_test123',
        amount: 13000, // $130 (120 + 10 tip)
        currency: 'usd',
        status: 'requires_confirmation',
        client_secret: 'pi_test123_secret',
        application_fee_amount: 1200, // 10% of service amount
        transfer_data: {
          destination: 'acct_provider123',
        },
      };

      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.processPayment(paymentDto);

      expect(result).toMatchObject({
        paymentIntentId: 'pi_test123',
        clientSecret: 'pi_test123_secret',
        amount: 130,
        platformFee: 12,
        providerAmount: 118,
      });

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 13000,
        currency: 'usd',
        payment_method: 'pm_card_visa',
        confirmation_method: 'manual',
        confirm: false,
        application_fee_amount: 1200,
        transfer_data: {
          destination: 'acct_provider123',
        },
        metadata: {
          bookingId: 'booking-123',
          customerId: 'customer-123',
          providerId: 'provider-123',
          serviceAmount: '120',
          tipAmount: '10',
          platformFee: '12',
        },
      });
    });

    it('should handle booking not found', async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.processPayment({
          bookingId: 'non-existent',
          paymentMethodId: 'pm_card_visa',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent payment for non-pending booking', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };

      bookingRepository.findOne.mockResolvedValue(confirmedBooking);

      await expect(
        service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_visa',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle provider without Stripe account', async () => {
      const bookingWithoutStripe = {
        ...mockBooking,
        provider: { id: 'provider-123' }, // No stripeAccountId
      };

      bookingRepository.findOne.mockResolvedValue(bookingWithoutStripe);

      await expect(
        service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_visa',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate commission correctly', async () => {
      const testCases = [
        { serviceAmount: 100, tipAmount: 0, expectedFee: 10, expectedProvider: 90 },
        { serviceAmount: 150, tipAmount: 20, expectedFee: 15, expectedProvider: 155 },
        { serviceAmount: 75.50, tipAmount: 5, expectedFee: 7.55, expectedProvider: 72.95 },
      ];

      for (const testCase of testCases) {
        const testBooking = {
          ...mockBooking,
          totalAmount: testCase.serviceAmount,
          service: { ...mockBooking.service, price: testCase.serviceAmount },
        };

        bookingRepository.findOne.mockResolvedValue(testBooking);
        stripe.paymentIntents.create.mockResolvedValue({
          id: 'pi_test',
          client_secret: 'secret',
        });

        const result = await service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_visa',
          tipAmount: testCase.tipAmount,
        });

        expect(result.platformFee).toBe(testCase.expectedFee);
        expect(result.providerAmount).toBe(testCase.expectedProvider);
      }
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm payment intent and update booking', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 13000,
        metadata: {
          bookingId: 'booking-123',
        },
      };

      stripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);
      stripe.charges.list.mockResolvedValue({
        data: [{
          id: 'ch_test123',
          receipt_url: 'https://receipt.stripe.com/test123',
        }],
      });

      bookingRepository.findOne.mockResolvedValue(mockBooking);
      bookingRepository.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentIntentId: 'pi_test123',
      });

      const result = await service.confirmPayment('pi_test123');

      expect(result).toMatchObject({
        bookingId: 'booking-123',
        status: 'succeeded',
        receiptUrl: 'https://receipt.stripe.com/test123',
      });

      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.CONFIRMED,
          paymentIntentId: 'pi_test123',
          paymentStatus: 'paid',
        })
      );
    });

    it('should handle payment failure', async () => {
      const mockFailedIntent = {
        id: 'pi_test123',
        status: 'failed',
        last_payment_error: {
          message: 'Card declined',
        },
      };

      stripe.paymentIntents.confirm.mockResolvedValue(mockFailedIntent);

      await expect(
        service.confirmPayment('pi_test123')
      ).rejects.toThrow('Payment failed: Card declined');
    });

    it('should handle 3D Secure authentication', async () => {
      const mockPendingIntent = {
        id: 'pi_test123',
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
        },
      };

      stripe.paymentIntents.confirm.mockResolvedValue(mockPendingIntent);

      const result = await service.confirmPayment('pi_test123');

      expect(result).toMatchObject({
        status: 'requires_action',
        requiresAction: true,
      });
    });
  });

  describe('Refund Processing', () => {
    it('should process full refund (24+ hours notice)', async () => {
      const futureBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentIntentId: 'pi_test123',
        bookingDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      };

      bookingRepository.findOne.mockResolvedValue(futureBooking);
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        amount: 12000,
      });

      const mockRefund = {
        id: 're_test123',
        amount: 12000,
        status: 'succeeded',
        reason: 'requested_by_customer',
      };

      stripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.processRefund({
        bookingId: 'booking-123',
        reason: 'Customer cancelled',
      });

      expect(result).toMatchObject({
        refundId: 're_test123',
        amount: 120,
        status: 'succeeded',
      });

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 12000,
        reason: 'requested_by_customer',
        metadata: {
          bookingId: 'booking-123',
          refundType: 'full',
        },
      });
    });

    it('should process partial refund (2-24 hours notice)', async () => {
      const soonBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentIntentId: 'pi_test123',
        bookingDate: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      };

      bookingRepository.findOne.mockResolvedValue(soonBooking);
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        amount: 12000,
        application_fee_amount: 1200,
      });

      const mockRefund = {
        id: 're_test123',
        amount: 6600, // 50% of total + 100% platform fee
        status: 'succeeded',
      };

      stripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.processRefund({
        bookingId: 'booking-123',
        reason: 'Emergency',
      });

      expect(result.amount).toBe(66); // 50% of $120 + $12 platform fee
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 6600,
        reason: 'requested_by_customer',
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: {
          bookingId: 'booking-123',
          refundType: 'partial_50_percent',
        },
      });
    });

    it('should process platform fee only refund (< 2 hours notice)', async () => {
      const immediateBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentIntentId: 'pi_test123',
        bookingDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      };

      bookingRepository.findOne.mockResolvedValue(immediateBooking);
      stripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        amount: 12000,
        application_fee_amount: 1200,
      });

      const mockRefund = {
        id: 're_test123',
        amount: 1200, // Platform fee only
        status: 'succeeded',
      };

      stripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.processRefund({
        bookingId: 'booking-123',
        reason: 'Last minute cancellation',
      });

      expect(result.amount).toBe(12); // Platform fee only
      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 1200,
        reason: 'requested_by_customer',
        refund_application_fee: true,
        metadata: {
          bookingId: 'booking-123',
          refundType: 'platform_fee_only',
        },
      });
    });

    it('should prevent refund for unpaid booking', async () => {
      const unpaidBooking = {
        ...mockBooking,
        status: BookingStatus.PENDING,
      };

      bookingRepository.findOne.mockResolvedValue(unpaidBooking);

      await expect(
        service.processRefund({
          bookingId: 'booking-123',
          reason: 'Not paid yet',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate refunds', async () => {
      const refundedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentIntentId: 'pi_test123',
        refundStatus: 'refunded',
      };

      bookingRepository.findOne.mockResolvedValue(refundedBooking);

      await expect(
        service.processRefund({
          bookingId: 'booking-123',
          reason: 'Already refunded',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Webhook Handling', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {
              bookingId: 'booking-123',
            },
          },
        },
      };

      stripe.webhookEndpoints.constructEvent = vi.fn().mockReturnValue(webhookEvent);
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      bookingRepository.update.mockResolvedValue({});

      await service.handleWebhook('webhook-body', 'stripe-signature');

      expect(bookingRepository.update).toHaveBeenCalledWith(
        { paymentIntentId: 'pi_test123' },
        { paymentStatus: 'paid', status: BookingStatus.CONFIRMED }
      );
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            metadata: {
              bookingId: 'booking-123',
            },
            last_payment_error: {
              message: 'Insufficient funds',
            },
          },
        },
      };

      stripe.webhookEndpoints.constructEvent = vi.fn().mockReturnValue(webhookEvent);
      bookingRepository.update.mockResolvedValue({});

      await service.handleWebhook('webhook-body', 'stripe-signature');

      expect(bookingRepository.update).toHaveBeenCalledWith(
        { paymentIntentId: 'pi_test123' },
        { 
          paymentStatus: 'failed',
          paymentError: 'Insufficient funds',
        }
      );
    });

    it('should handle charge.refunded webhook', async () => {
      const webhookEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_test123',
            payment_intent: 'pi_test123',
            refunded: true,
            amount_refunded: 12000,
          },
        },
      };

      stripe.webhookEndpoints.constructEvent = vi.fn().mockReturnValue(webhookEvent);
      bookingRepository.update.mockResolvedValue({});

      await service.handleWebhook('webhook-body', 'stripe-signature');

      expect(bookingRepository.update).toHaveBeenCalledWith(
        { paymentIntentId: 'pi_test123' },
        {
          refundStatus: 'refunded',
          refundAmount: 120,
          status: BookingStatus.CANCELLED,
        }
      );
    });

    it('should verify webhook signature', async () => {
      const invalidSignature = 'invalid-signature';
      stripe.webhookEndpoints.constructEvent = vi.fn().mockImplementation(() => {
        throw new Error('Webhook signature verification failed');
      });

      await expect(
        service.handleWebhook('webhook-body', invalidSignature)
      ).rejects.toThrow('Webhook signature verification failed');
    });
  });

  describe('Payment Method Management', () => {
    it('should save payment method for future use', async () => {
      const paymentDto = {
        bookingId: 'booking-123',
        paymentMethodId: 'pm_card_visa',
        savePaymentMethod: true,
      };

      bookingRepository.findOne.mockResolvedValue(mockBooking);
      stripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'secret',
      });
      stripe.paymentMethods = {
        attach: vi.fn().mockResolvedValue({}),
      };

      await service.processPayment(paymentDto);

      expect(stripe.paymentMethods.attach).toHaveBeenCalledWith(
        'pm_card_visa',
        { customer: expect.any(String) }
      );
    });

    it('should handle Strong Customer Authentication (SCA)', async () => {
      const mockSCAIntent = {
        id: 'pi_test123',
        status: 'requires_action',
        next_action: {
          type: 'use_stripe_sdk',
          use_stripe_sdk: {
            type: 'three_d_secure_redirect',
            stripe_js: 'https://hooks.stripe.com/3d_secure',
          },
        },
        client_secret: 'pi_test123_secret_sca',
      };

      bookingRepository.findOne.mockResolvedValue(mockBooking);
      stripe.paymentIntents.create.mockResolvedValue(mockSCAIntent);

      const result = await service.processPayment({
        bookingId: 'booking-123',
        paymentMethodId: 'pm_card_3ds',
      });

      expect(result).toMatchObject({
        requiresAction: true,
        paymentIntentId: 'pi_test123',
        clientSecret: 'pi_test123_secret_sca',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors', async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      stripe.paymentIntents.create.mockRejectedValue({
        type: 'StripeCardError',
        raw: {
          message: 'Your card was declined',
          code: 'card_declined',
        },
      });

      await expect(
        service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_declined',
        })
      ).rejects.toThrow('Your card was declined');
    });

    it('should handle network errors', async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      stripe.paymentIntents.create.mockRejectedValue(new Error('Network error'));

      await expect(
        service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_visa',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid API key', async () => {
      configService.get.mockReturnValue('invalid_key');
      vi.mocked(Stripe).mockImplementation(() => {
        throw new Error('Invalid API Key provided');
      });

      await expect(
        service.processPayment({
          bookingId: 'booking-123',
          paymentMethodId: 'pm_card_visa',
        })
      ).rejects.toThrow();
    });
  });
}); 