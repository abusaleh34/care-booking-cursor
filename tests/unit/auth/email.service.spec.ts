import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
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
  let module: TestingModule;

  const mockEmailConfig = {
    SMTP_HOST: 'smtp.test.com',
    SMTP_PORT: 587,
    SMTP_USER: 'test@test.com',
    SMTP_PASS: 'testpass',
    MAIL_FROM: 'noreply@careservices.test',
    FRONTEND_URL: 'http://localhost:3000',
    APP_NAME: 'Care Services',
    NODE_ENV: 'test'
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
    };
    
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter);

    module = await Test.createTestingModule({
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
    configService = module.get<ConfigService>(ConfigService);

    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('constructor', () => {
    it('should create nodemailer transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'testpass',
        },
      });
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const email = 'test@example.com';
      const token = 'verification-token';

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: email,
        subject: 'Verify Your Email - Care Services',
        html: expect.stringContaining('Verify Your Email'),
      });
    });

    it('should handle email sending errors', async () => {
      const email = 'test@example.com';
      const token = 'verification-token';
      const error = new Error('SMTP Error');

      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendVerificationEmail(email, token)).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'test@example.com';
      const token = 'reset-token';

      await service.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: email,
        subject: 'Reset Your Password - Care Services',
        html: expect.stringContaining('Reset Password'),
      });
    });
  });

  describe('sendPasswordChangeNotification', () => {
    it('should send password change notification', async () => {
      const email = 'test@example.com';

      await service.sendPasswordChangeNotification(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: email,
        subject: 'Password Changed - Care Services',
        html: expect.stringContaining('Password Changed'),
      });
    });
  });

  describe('sendPasswordResetConfirmation', () => {
    it('should send password reset confirmation', async () => {
      const email = 'test@example.com';

      await service.sendPasswordResetConfirmation(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: email,
        subject: 'Password Reset Successful - Care Services',
        html: expect.stringContaining('Password Reset Successful'),
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing SMTP configuration gracefully', async () => {
      // Create a new service instance with missing SMTP config
      const moduleWithMissingConfig = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn((key: string) => {
                if (key === 'SMTP_HOST') return null;
                return mockEmailConfig[key];
              })
            }
          }
        ]
      }).compile();

      const serviceWithMissingConfig = moduleWithMissingConfig.get<EmailService>(EmailService);

      // Should not throw, just log a warning
      await expect(serviceWithMissingConfig.sendVerificationEmail('test@example.com', 'token')).resolves.not.toThrow();

      await moduleWithMissingConfig.close();
    });
  });
});