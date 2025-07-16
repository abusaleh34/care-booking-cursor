import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

import { EmailService } from '../../../src/auth/services/email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  const mockEmailConfig = {
    MAIL_HOST: 'smtp.test.com',
    MAIL_PORT: '587',
    MAIL_USER: 'test@test.com',
    MAIL_PASS: 'testpass',
    MAIL_FROM: 'noreply@careservices.test',
    FRONTEND_URL: 'http://localhost:3000',
    APP_NAME: 'Care Services'
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
    };
    
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => mockEmailConfig[key])
          }
        }
      ]
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create nodemailer transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'testpass'
        }
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const email = 'user@test.com';
      const token = 'verification-token-123';

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Verify Your Email - Care Services',
        html: expect.stringContaining('Welcome to Care Services!'),
        text: expect.stringContaining('Welcome to Care Services!')
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain(`http://localhost:3000/verify-email?token=${token}`);
      expect(sentHtml).toContain('Verify Email');
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(
        service.sendVerificationEmail('user@test.com', 'token')
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'user@test.com';
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Reset Your Password - Care Services',
        html: expect.stringContaining('You requested a password reset'),
        text: expect.stringContaining('You requested a password reset')
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain(`http://localhost:3000/reset-password?token=${token}`);
      expect(sentHtml).toContain('Reset Password');
      expect(sentHtml).toContain('This link will expire in 1 hour');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email for customers', async () => {
      const email = 'customer@test.com';
      const name = 'John Doe';

      await service.sendWelcomeEmail(email, name, 'customer');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Welcome to Care Services!',
        html: expect.stringContaining(`Welcome ${name}!`),
        text: expect.stringContaining(`Welcome ${name}!`)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Browse Services');
      expect(sentHtml).toContain('http://localhost:3000/services');
    });

    it('should send welcome email for providers', async () => {
      const email = 'provider@test.com';
      const name = 'Jane Provider';

      await service.sendWelcomeEmail(email, name, 'provider');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Complete Your Profile');
      expect(sentHtml).toContain('http://localhost:3000/provider/profile');
    });

    it('should send generic welcome for unknown role', async () => {
      const email = 'admin@test.com';
      const name = 'Admin User';

      await service.sendWelcomeEmail(email, name, 'admin');

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).not.toContain('Browse Services');
      expect(sentHtml).not.toContain('Complete Your Profile');
    });
  });

  describe('sendBookingConfirmation', () => {
    const bookingDetails = {
      customerName: 'John Doe',
      providerName: 'Jane\'s Spa',
      serviceName: 'Full Body Massage',
      date: '2025-07-20',
      time: '14:00',
      duration: 60,
      price: 150,
      location: '123 Main St, City',
      bookingId: 'booking-123'
    };

    it('should send booking confirmation to customer', async () => {
      const email = 'customer@test.com';

      await service.sendBookingConfirmation(email, bookingDetails, 'customer');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Booking Confirmed - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Your booking has been confirmed!');
      expect(sentHtml).toContain('Full Body Massage');
      expect(sentHtml).toContain('July 20, 2025 at 14:00');
      expect(sentHtml).toContain('$150');
      expect(sentHtml).toContain('View Booking');
    });

    it('should send booking notification to provider', async () => {
      const email = 'provider@test.com';

      await service.sendBookingConfirmation(email, bookingDetails, 'provider');

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('You have a new booking!');
      expect(sentHtml).toContain('John Doe');
      expect(sentHtml).toContain('Manage Booking');
    });
  });

  describe('sendBookingCancellation', () => {
    const cancellationDetails = {
      customerName: 'John Doe',
      providerName: 'Jane\'s Spa',
      serviceName: 'Full Body Massage',
      date: '2025-07-20',
      time: '14:00',
      reason: 'Customer requested cancellation',
      bookingId: 'booking-123'
    };

    it('should send cancellation email to customer', async () => {
      const email = 'customer@test.com';

      await service.sendBookingCancellation(email, cancellationDetails, 'customer');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Booking Cancelled - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Your booking has been cancelled');
      expect(sentHtml).toContain('Customer requested cancellation');
    });

    it('should send cancellation email to provider', async () => {
      const email = 'provider@test.com';

      await service.sendBookingCancellation(email, cancellationDetails, 'provider');

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('A booking has been cancelled');
    });
  });

  describe('sendBookingReminder', () => {
    const reminderDetails = {
      customerName: 'John Doe',
      serviceName: 'Full Body Massage',
      date: '2025-07-20',
      time: '14:00',
      providerName: 'Jane\'s Spa',
      location: '123 Main St',
      bookingId: 'booking-123'
    };

    it('should send reminder email with correct details', async () => {
      const email = 'customer@test.com';

      await service.sendBookingReminder(email, reminderDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Booking Reminder - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('This is a reminder for your upcoming booking');
      expect(sentHtml).toContain('Tomorrow');
      expect(sentHtml).toContain('Full Body Massage');
      expect(sentHtml).toContain('14:00');
    });
  });

  describe('sendPaymentReceipt', () => {
    const paymentDetails = {
      customerName: 'John Doe',
      amount: 150,
      serviceName: 'Full Body Massage',
      providerName: 'Jane\'s Spa',
      date: '2025-07-20',
      paymentMethod: 'Credit Card',
      transactionId: 'txn_123456'
    };

    it('should send payment receipt email', async () => {
      const email = 'customer@test.com';

      await service.sendPaymentReceipt(email, paymentDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Payment Receipt - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Payment Receipt');
      expect(sentHtml).toContain('$150');
      expect(sentHtml).toContain('Credit Card');
      expect(sentHtml).toContain('txn_123456');
    });
  });

  describe('sendAccountLockNotification', () => {
    it('should send account lock notification', async () => {
      const email = 'user@test.com';
      const reason = 'Multiple failed login attempts';

      await service.sendAccountLockNotification(email, reason);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Account Locked - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Your account has been temporarily locked');
      expect(sentHtml).toContain(reason);
      expect(sentHtml).toContain('Contact Support');
    });
  });

  describe('sendAccountUnlockNotification', () => {
    it('should send account unlock notification', async () => {
      const email = 'user@test.com';

      await service.sendAccountUnlockNotification(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Account Unlocked - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Your account has been unlocked');
      expect(sentHtml).toContain('You can now log in');
    });
  });

  describe('sendReviewRequest', () => {
    const reviewDetails = {
      customerName: 'John Doe',
      serviceName: 'Full Body Massage',
      providerName: 'Jane\'s Spa',
      bookingId: 'booking-123'
    };

    it('should send review request email', async () => {
      const email = 'customer@test.com';

      await service.sendReviewRequest(email, reviewDetails);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'How was your experience? - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('How was your experience with');
      expect(sentHtml).toContain('Full Body Massage');
      expect(sentHtml).toContain('Jane\'s Spa');
      expect(sentHtml).toContain('Leave a Review');
    });
  });

  describe('sendProviderApprovalNotification', () => {
    it('should send approval notification', async () => {
      const email = 'provider@test.com';
      const businessName = 'Jane\'s Spa';

      await service.sendProviderApprovalNotification(email, businessName, true);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Provider Application Approved - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('Congratulations!');
      expect(sentHtml).toContain('has been approved');
      expect(sentHtml).toContain('Start Managing Services');
    });

    it('should send rejection notification', async () => {
      const email = 'provider@test.com';
      const businessName = 'Test Business';
      const reason = 'Incomplete documentation';

      await service.sendProviderApprovalNotification(email, businessName, false, reason);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject: 'Provider Application Update - Care Services',
        html: expect.any(String),
        text: expect.any(String)
      });

      const sentHtml = mockTransporter.sendMail.mock.calls[0][0].html;
      expect(sentHtml).toContain('requires additional information');
      expect(sentHtml).toContain(reason);
      expect(sentHtml).toContain('Reapply');
    });
  });

  describe('sendCustomEmail', () => {
    it('should send custom email with provided content', async () => {
      const email = 'user@test.com';
      const subject = 'Custom Subject';
      const htmlContent = '<h1>Custom HTML</h1>';
      const textContent = 'Custom Text';

      await service.sendCustomEmail(email, subject, htmlContent, textContent);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject,
        html: htmlContent,
        text: textContent
      });
    });

    it('should generate text from HTML if not provided', async () => {
      const email = 'user@test.com';
      const subject = 'Custom Subject';
      const htmlContent = '<h1>Title</h1><p>Paragraph text</p>';

      await service.sendCustomEmail(email, subject, htmlContent);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Care Services" <noreply@careservices.test>',
        to: email,
        subject,
        html: htmlContent,
        text: expect.stringContaining('Title')
      });
    });
  });

  describe('error handling', () => {
    it('should propagate transporter errors', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValueOnce(error);

      await expect(
        service.sendVerificationEmail('user@test.com', 'token')
      ).rejects.toThrow('SMTP connection failed');
    });

    it('should handle missing email configuration gracefully', async () => {
      vi.mocked(configService.get).mockImplementation((key: string) => {
        if (key === 'MAIL_FROM') return undefined;
        return mockEmailConfig[key];
      });

      // Service should still work with default from address
      await service.sendVerificationEmail('user@test.com', 'token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('<>')
        })
      );
    });
  });
});