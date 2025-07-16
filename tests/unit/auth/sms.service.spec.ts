import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

// Mock Twilio
const mockTwilioClient = {
  messages: {
    create: vi.fn().mockResolvedValue({
      sid: 'test-message-id',
      status: 'sent',
      to: '+1234567890',
      from: '+15005550006',
      body: 'Test message'
    })
  }
};

vi.mock('twilio', () => ({
  default: vi.fn(() => mockTwilioClient)
}));

import { SmsService } from '../../../src/auth/services/sms.service';
import { TokenService } from '../../../src/auth/services/token.service';

describe('SmsService', () => {
  let service: SmsService;
  let tokenService: TokenService;
  let configService: ConfigService;

  const mockConfig = {
    TWILIO_ACCOUNT_SID: 'AC123456789',
    TWILIO_AUTH_TOKEN: 'auth_token_123',
    TWILIO_PHONE_NUMBER: '+15005550006',
    NODE_ENV: 'test'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: TokenService,
          useValue: {
            generatePhoneVerificationCode: vi.fn(),
            verifyPhoneVerificationCode: vi.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => mockConfig[key])
          }
        }
      ]
    }).compile();

    service = module.get<SmsService>(SmsService);
    tokenService = module.get<TokenService>(TokenService);
    configService = module.get<ConfigService>(ConfigService);

    vi.clearAllMocks();
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number formats', () => {
      const validNumbers = [
        '+1234567890',
        '+12345678901',
        '+123456789012',
        '+447911123456',
        '+33123456789'
      ];

      validNumbers.forEach(number => {
        expect(() => service.validatePhoneNumber(number)).not.toThrow();
      });
    });

    it('should throw error for invalid phone numbers', () => {
      const invalidNumbers = [
        '1234567890',           // Missing +
        '+123456789',           // Too short
        '+1234567890123456',    // Too long
        '+abc1234567890',       // Contains letters
        '+1234-567-890',        // Contains hyphens
        '+1234 567 890',        // Contains spaces
        '',                     // Empty
        null,                   // Null
        undefined               // Undefined
      ];

      invalidNumbers.forEach(number => {
        expect(() => service.validatePhoneNumber(number)).toThrow(BadRequestException);
      });
    });
  });

  describe('sendSms', () => {
    it('should send SMS with correct parameters', async () => {
      const phone = '+1234567890';
      const message = 'Test message';

      const result = await service.sendSms(phone, message);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: message,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        sid: 'test-message-id',
        status: 'sent',
        to: '+1234567890',
        from: '+15005550006',
        body: 'Test message'
      });
    });

    it('should validate phone number before sending', async () => {
      const invalidPhone = 'invalid-phone';
      const message = 'Test message';

      await expect(service.sendSms(invalidPhone, message)).rejects.toThrow(BadRequestException);
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it('should handle Twilio errors', async () => {
      const phone = '+1234567890';
      const message = 'Test message';
      const twilioError = new Error('Twilio API error');

      mockTwilioClient.messages.create.mockRejectedValueOnce(twilioError);

      await expect(service.sendSms(phone, message)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle missing Twilio configuration', async () => {
      vi.mocked(configService.get).mockImplementation((key: string) => {
        if (key === 'TWILIO_ACCOUNT_SID') return undefined;
        return mockConfig[key];
      });

      // Create new instance with missing config
      const moduleWithMissingConfig = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: TokenService,
            useValue: {
              generatePhoneVerificationCode: vi.fn(),
              verifyPhoneVerificationCode: vi.fn()
            }
          },
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn((key: string) => {
                if (key === 'TWILIO_ACCOUNT_SID') return undefined;
                return mockConfig[key];
              })
            }
          }
        ]
      }).compile();

      const serviceWithMissingConfig = moduleWithMissingConfig.get<SmsService>(SmsService);

      await expect(
        serviceWithMissingConfig.sendSms('+1234567890', 'Test')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendVerificationCode', () => {
    it('should generate and send verification code', async () => {
      const phone = '+1234567890';
      const verificationCode = '123456';

      vi.mocked(tokenService.generatePhoneVerificationCode).mockResolvedValue(verificationCode);

      const result = await service.sendVerificationCode(phone);

      expect(tokenService.generatePhoneVerificationCode).toHaveBeenCalledWith(phone);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: `Your Care Services verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Verification code sent successfully'
      });
    });

    it('should handle errors during code generation', async () => {
      const phone = '+1234567890';
      const error = new Error('Token generation failed');

      vi.mocked(tokenService.generatePhoneVerificationCode).mockRejectedValueOnce(error);

      await expect(service.sendVerificationCode(phone)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle SMS sending errors during verification', async () => {
      const phone = '+1234567890';
      const verificationCode = '123456';

      vi.mocked(tokenService.generatePhoneVerificationCode).mockResolvedValue(verificationCode);
      mockTwilioClient.messages.create.mockRejectedValueOnce(new Error('SMS send failed'));

      await expect(service.sendVerificationCode(phone)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyCode', () => {
    it('should verify valid code', async () => {
      const phone = '+1234567890';
      const code = '123456';

      vi.mocked(tokenService.verifyPhoneVerificationCode).mockResolvedValue(true);

      const result = await service.verifyCode(phone, code);

      expect(tokenService.verifyPhoneVerificationCode).toHaveBeenCalledWith(phone, code);
      expect(result).toBe(true);
    });

    it('should return false for invalid code', async () => {
      const phone = '+1234567890';
      const code = '000000';

      vi.mocked(tokenService.verifyPhoneVerificationCode).mockResolvedValue(false);

      const result = await service.verifyCode(phone, code);

      expect(result).toBe(false);
    });

    it('should validate phone number before verification', async () => {
      const invalidPhone = 'invalid-phone';
      const code = '123456';

      await expect(service.verifyCode(invalidPhone, code)).rejects.toThrow(BadRequestException);
      expect(tokenService.verifyPhoneVerificationCode).not.toHaveBeenCalled();
    });

    it('should handle token service errors', async () => {
      const phone = '+1234567890';
      const code = '123456';
      const error = new Error('Token verification failed');

      vi.mocked(tokenService.verifyPhoneVerificationCode).mockRejectedValueOnce(error);

      await expect(service.verifyCode(phone, code)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendBookingNotification', () => {
    it('should send booking notification SMS', async () => {
      const phone = '+1234567890';
      const bookingDetails = {
        customerName: 'John Doe',
        serviceName: 'Full Body Massage',
        date: '2025-07-20',
        time: '14:00',
        providerName: 'Jane\'s Spa'
      };

      const result = await service.sendBookingNotification(phone, bookingDetails);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: `Hi John Doe, your booking for Full Body Massage with Jane's Spa on 2025-07-20 at 14:00 has been confirmed. - Care Services`,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Booking notification sent successfully'
      });
    });

    it('should handle special characters in names', async () => {
      const phone = '+1234567890';
      const bookingDetails = {
        customerName: 'María José',
        serviceName: 'Relaxation & Therapy',
        date: '2025-07-20',
        time: '14:00',
        providerName: 'Zen & Wellness'
      };

      await service.sendBookingNotification(phone, bookingDetails);

      const expectedMessage = `Hi María José, your booking for Relaxation & Therapy with Zen & Wellness on 2025-07-20 at 14:00 has been confirmed. - Care Services`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15005550006',
        to: phone
      });
    });
  });

  describe('sendBookingReminder', () => {
    it('should send booking reminder SMS', async () => {
      const phone = '+1234567890';
      const reminderDetails = {
        customerName: 'John Doe',
        serviceName: 'Full Body Massage',
        date: '2025-07-20',
        time: '14:00',
        providerName: 'Jane\'s Spa'
      };

      const result = await service.sendBookingReminder(phone, reminderDetails);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: `Reminder: Hi John Doe, you have a booking for Full Body Massage with Jane's Spa tomorrow at 14:00. - Care Services`,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Booking reminder sent successfully'
      });
    });
  });

  describe('sendBookingCancellation', () => {
    it('should send booking cancellation SMS', async () => {
      const phone = '+1234567890';
      const cancellationDetails = {
        customerName: 'John Doe',
        serviceName: 'Full Body Massage',
        date: '2025-07-20',
        time: '14:00',
        reason: 'Provider unavailable'
      };

      const result = await service.sendBookingCancellation(phone, cancellationDetails);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: `Hi John Doe, your booking for Full Body Massage on 2025-07-20 at 14:00 has been cancelled. Reason: Provider unavailable - Care Services`,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Booking cancellation sent successfully'
      });
    });

    it('should handle cancellation without reason', async () => {
      const phone = '+1234567890';
      const cancellationDetails = {
        customerName: 'John Doe',
        serviceName: 'Full Body Massage',
        date: '2025-07-20',
        time: '14:00'
      };

      await service.sendBookingCancellation(phone, cancellationDetails);

      const expectedMessage = `Hi John Doe, your booking for Full Body Massage on 2025-07-20 at 14:00 has been cancelled. - Care Services`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15005550006',
        to: phone
      });
    });
  });

  describe('sendSecurityAlert', () => {
    it('should send security alert SMS', async () => {
      const phone = '+1234567890';
      const alertType = 'login_from_new_device';
      const details = {
        device: 'iPhone',
        location: 'New York, NY',
        timestamp: '2025-07-16 10:30'
      };

      const result = await service.sendSecurityAlert(phone, alertType, details);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: `Security Alert: New login detected from iPhone in New York, NY at 2025-07-16 10:30. If this wasn't you, please secure your account immediately. - Care Services`,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Security alert sent successfully'
      });
    });

    it('should handle password change alert', async () => {
      const phone = '+1234567890';
      const alertType = 'password_changed';
      const details = {
        timestamp: '2025-07-16 10:30'
      };

      await service.sendSecurityAlert(phone, alertType, details);

      const expectedMessage = `Security Alert: Your password was changed at 2025-07-16 10:30. If this wasn't you, please contact support immediately. - Care Services`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15005550006',
        to: phone
      });
    });

    it('should handle account locked alert', async () => {
      const phone = '+1234567890';
      const alertType = 'account_locked';
      const details = {
        reason: 'Multiple failed login attempts',
        timestamp: '2025-07-16 10:30'
      };

      await service.sendSecurityAlert(phone, alertType, details);

      const expectedMessage = `Security Alert: Your account has been locked due to Multiple failed login attempts at 2025-07-16 10:30. Contact support to unlock. - Care Services`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15005550006',
        to: phone
      });
    });

    it('should handle unknown alert types', async () => {
      const phone = '+1234567890';
      const alertType = 'unknown_alert';
      const details = {};

      await service.sendSecurityAlert(phone, alertType, details);

      const expectedMessage = `Security Alert: Unusual activity detected on your account. Please check your account security. - Care Services`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15005550006',
        to: phone
      });
    });
  });

  describe('sendCustomMessage', () => {
    it('should send custom message', async () => {
      const phone = '+1234567890';
      const message = 'Custom message content';

      const result = await service.sendCustomMessage(phone, message);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: message,
        from: '+15005550006',
        to: phone
      });

      expect(result).toEqual({
        success: true,
        message: 'Custom message sent successfully'
      });
    });
  });

  describe('test environment handling', () => {
    it('should work in test environment', async () => {
      const phone = '+1234567890';
      const message = 'Test message';

      // Test environment is already set in mockConfig
      await service.sendSms(phone, message);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: message,
        from: '+15005550006',
        to: phone
      });
    });

    it('should handle production environment', async () => {
      // Mock production environment
      vi.mocked(configService.get).mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return mockConfig[key];
      });

      const phone = '+1234567890';
      const message = 'Test message';

      await service.sendSms(phone, message);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: message,
        from: '+15005550006',
        to: phone
      });
    });
  });

  describe('rate limiting considerations', () => {
    it('should handle rate limiting from Twilio', async () => {
      const phone = '+1234567890';
      const message = 'Test message';
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.code = 20003;

      mockTwilioClient.messages.create.mockRejectedValueOnce(rateLimitError);

      await expect(service.sendSms(phone, message)).rejects.toThrow(InternalServerErrorException);
    });
  });
});