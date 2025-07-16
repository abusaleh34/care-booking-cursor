import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Mock speakeasy module
vi.mock('speakeasy', () => ({
  default: {
    generateSecret: vi.fn().mockReturnValue({
      base32: 'MOCKED_SECRET_BASE32',
      otpauth_url: 'otpauth://totp/Care%20Services:userId?secret=MOCKED_SECRET_BASE32&issuer=Care%20Services'
    }),
    totp: {
      verify: vi.fn()
    }
  }
}));

import * as speakeasy from 'speakeasy';
import { TokenService } from '../../../src/auth/services/token.service';
import { MfaSecret } from '../../../src/database/entities/mfa-secret.entity';

describe('TokenService', () => {
  let service: TokenService;
  let mfaSecretRepository: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockMfaSecret = {
    id: 'mfa-123',
    userId: 'user-123',
    secret: 'SECRET_BASE32',
    backupCodes: ['BACKUP1', 'BACKUP2', 'BACKUP3'],
    isVerified: true
  };

  beforeEach(async () => {
    // Mock crypto.randomBytes
    vi.spyOn(crypto, 'randomBytes').mockImplementation((size: number) => {
      const buffer = Buffer.alloc(size);
      buffer.fill('a');
      return buffer as any;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: getRepositoryToken(MfaSecret),
          useValue: {
            findOne: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn(),
            verify: vi.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('Care Services')
          }
        }
      ]
    }).compile();

    service = module.get<TokenService>(TokenService);
    mfaSecretRepository = module.get(getRepositoryToken(MfaSecret));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate a unique email verification token', async () => {
      const userId = 'user-123';
      const token = await service.generateEmailVerificationToken(userId);

      expect(token).toBe('6161616161616161616161616161616161616161616161616161616161616161');
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('should store token with 24 hour expiration', async () => {
      const userId = 'user-123';
      const beforeTime = new Date();
      
      const token = await service.generateEmailVerificationToken(userId);
      
      // Access private tokenStore through any type
      const tokenStore = (service as any).tokenStore;
      const storedToken = tokenStore.get(token);
      
      expect(storedToken).toBeDefined();
      expect(storedToken.userId).toBe(userId);
      expect(storedToken.type).toBe('email_verification');
      expect(storedToken.expiresAt.getTime()).toBeGreaterThan(beforeTime.getTime() + 23 * 60 * 60 * 1000);
      expect(storedToken.expiresAt.getTime()).toBeLessThan(beforeTime.getTime() + 25 * 60 * 60 * 1000);
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should verify valid email verification token', async () => {
      const userId = 'user-123';
      const token = await service.generateEmailVerificationToken(userId);
      
      const result = await service.verifyEmailVerificationToken(token);
      
      expect(result).toBe(userId);
      
      // Token should be deleted after verification
      const tokenStore = (service as any).tokenStore;
      expect(tokenStore.has(token)).toBe(false);
    });

    it('should return null for invalid token', async () => {
      const result = await service.verifyEmailVerificationToken('invalid-token');
      
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const userId = 'user-123';
      const token = 'expired-token';
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 25);
      
      // Manually add expired token
      const tokenStore = (service as any).tokenStore;
      tokenStore.set(token, {
        userId,
        expiresAt: expiredDate,
        type: 'email_verification'
      });
      
      const result = await service.verifyEmailVerificationToken(token);
      
      expect(result).toBeNull();
      expect(tokenStore.has(token)).toBe(false);
    });

    it('should return null for wrong token type', async () => {
      const token = 'wrong-type-token';
      
      // Manually add token with wrong type
      const tokenStore = (service as any).tokenStore;
      tokenStore.set(token, {
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 1000000),
        type: 'password_reset'
      });
      
      const result = await service.verifyEmailVerificationToken(token);
      
      expect(result).toBeNull();
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate password reset token with 1 hour expiration', async () => {
      const userId = 'user-123';
      const beforeTime = new Date();
      
      const token = await service.generatePasswordResetToken(userId);
      
      const tokenStore = (service as any).tokenStore;
      const storedToken = tokenStore.get(token);
      
      expect(storedToken).toBeDefined();
      expect(storedToken.userId).toBe(userId);
      expect(storedToken.type).toBe('password_reset');
      expect(storedToken.expiresAt.getTime()).toBeGreaterThan(beforeTime.getTime() + 50 * 60 * 1000);
      expect(storedToken.expiresAt.getTime()).toBeLessThan(beforeTime.getTime() + 70 * 60 * 1000);
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify valid password reset token', async () => {
      const userId = 'user-123';
      const token = await service.generatePasswordResetToken(userId);
      
      const result = await service.verifyPasswordResetToken(token);
      
      expect(result).toBe(userId);
      
      // Token should be deleted after verification
      const tokenStore = (service as any).tokenStore;
      expect(tokenStore.has(token)).toBe(false);
    });

    it('should return null for expired password reset token', async () => {
      const userId = 'user-123';
      const token = 'expired-reset-token';
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2);
      
      const tokenStore = (service as any).tokenStore;
      tokenStore.set(token, {
        userId,
        expiresAt: expiredDate,
        type: 'password_reset'
      });
      
      const result = await service.verifyPasswordResetToken(token);
      
      expect(result).toBeNull();
    });
  });

  describe('generatePhoneVerificationCode', () => {
    it('should generate 6-digit verification code', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      const phone = '+1234567890';
      const code = await service.generatePhoneVerificationCode(phone);
      
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('should store code with 10 minute expiration', async () => {
      const phone = '+1234567890';
      const beforeTime = new Date();
      
      const code = await service.generatePhoneVerificationCode(phone);
      
      const tokenStore = (service as any).tokenStore;
      const storedToken = tokenStore.get(`phone_${phone}`);
      
      expect(storedToken).toBeDefined();
      expect(storedToken.userId).toBe(code);
      expect(storedToken.type).toBe('phone_verification');
      expect(storedToken.expiresAt.getTime()).toBeGreaterThan(beforeTime.getTime() + 9 * 60 * 1000);
      expect(storedToken.expiresAt.getTime()).toBeLessThan(beforeTime.getTime() + 11 * 60 * 1000);
    });
  });

  describe('verifyPhoneVerificationCode', () => {
    it('should verify valid phone code', async () => {
      const phone = '+1234567890';
      const code = await service.generatePhoneVerificationCode(phone);
      
      const result = await service.verifyPhoneVerificationCode(phone, code);
      
      expect(result).toBe(true);
      
      // Code should be deleted after verification
      const tokenStore = (service as any).tokenStore;
      expect(tokenStore.has(`phone_${phone}`)).toBe(false);
    });

    it('should return false for invalid code', async () => {
      const phone = '+1234567890';
      await service.generatePhoneVerificationCode(phone);
      
      const result = await service.verifyPhoneVerificationCode(phone, '000000');
      
      expect(result).toBe(false);
    });

    it('should return false for expired code', async () => {
      const phone = '+1234567890';
      const code = '123456';
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 15);
      
      const tokenStore = (service as any).tokenStore;
      tokenStore.set(`phone_${phone}`, {
        userId: code,
        expiresAt: expiredDate,
        type: 'phone_verification'
      });
      
      const result = await service.verifyPhoneVerificationCode(phone, code);
      
      expect(result).toBe(false);
      expect(tokenStore.has(`phone_${phone}`)).toBe(false);
    });
  });

  describe('generateMfaSecret', () => {
    it('should generate MFA secret with backup codes', async () => {
      const userId = 'user-123';
      
      const result = await service.generateMfaSecret(userId);
      
      expect(result.secret).toBe('MOCKED_SECRET_BASE32');
      expect(result.qrCodeUrl).toContain('otpauth://totp/Care%20Services');
      expect(result.backupCodes).toHaveLength(10);
      expect(result.backupCodes.every(code => code.length === 8)).toBe(true);
      
      expect(mfaSecretRepository.save).toHaveBeenCalledWith({
        userId,
        secret: 'MOCKED_SECRET_BASE32',
        backupCodes: expect.any(Array),
        isVerified: false
      });
    });

    it('should use custom issuer from config', async () => {
      vi.mocked(configService.get).mockReturnValueOnce('Custom Issuer');
      
      const userId = 'user-123';
      await service.generateMfaSecret(userId);
      
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: `Care Services (${userId})`,
        issuer: 'Custom Issuer',
        length: 32
      });
    });
  });

  describe('verifyMfaCode', () => {
    beforeEach(() => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValue(mockMfaSecret);
    });

    it('should verify valid TOTP code', async () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);
      
      const result = await service.verifyMfaCode('user-123', '123456');
      
      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'SECRET_BASE32',
        encoding: 'base32',
        token: '123456',
        window: 2
      });
    });

    it('should verify and consume backup code', async () => {
      const result = await service.verifyMfaCode('user-123', 'backup1');
      
      expect(result).toBe(true);
      expect(mfaSecretRepository.update).toHaveBeenCalledWith('mfa-123', {
        backupCodes: ['BACKUP2', 'BACKUP3']
      });
    });

    it('should handle case-insensitive backup codes', async () => {
      const result = await service.verifyMfaCode('user-123', 'backup1');
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent user MFA', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValueOnce(null);
      
      const result = await service.verifyMfaCode('user-123', '123456');
      
      expect(result).toBe(false);
    });

    it('should return false for invalid TOTP code', async () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      
      const result = await service.verifyMfaCode('user-123', '000000');
      
      expect(result).toBe(false);
    });

    it('should return false for non-verified MFA secret', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValueOnce({
        ...mockMfaSecret,
        isVerified: false
      });
      
      const result = await service.verifyMfaCode('user-123', '123456');
      
      expect(result).toBe(false);
    });
  });

  describe('verifyMfaSetup', () => {
    it('should verify and activate MFA setup', async () => {
      const unverifiedSecret = { ...mockMfaSecret, isVerified: false };
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValue(unverifiedSecret);
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);
      
      const result = await service.verifyMfaSetup('user-123', '123456');
      
      expect(result).toBe(true);
      expect(mfaSecretRepository.update).toHaveBeenCalledWith('mfa-123', {
        isVerified: true
      });
    });

    it('should return false for already verified MFA', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValueOnce(null);
      
      const result = await service.verifyMfaSetup('user-123', '123456');
      
      expect(result).toBe(false);
    });

    it('should not update if code is invalid', async () => {
      const unverifiedSecret = { ...mockMfaSecret, isVerified: false };
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValue(unverifiedSecret);
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      
      const result = await service.verifyMfaSetup('user-123', '000000');
      
      expect(result).toBe(false);
      expect(mfaSecretRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('removeMfaSecret', () => {
    it('should delete MFA secret for user', async () => {
      await service.removeMfaSecret('user-123');
      
      expect(mfaSecretRepository.delete).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('getMfaBackupCodes', () => {
    it('should return backup codes for verified MFA', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValue(mockMfaSecret);
      
      const codes = await service.getMfaBackupCodes('user-123');
      
      expect(codes).toEqual(['BACKUP1', 'BACKUP2', 'BACKUP3']);
    });

    it('should return empty array if no MFA setup', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValueOnce(null);
      
      const codes = await service.getMfaBackupCodes('user-123');
      
      expect(codes).toEqual([]);
    });

    it('should return empty array for unverified MFA', async () => {
      vi.mocked(mfaSecretRepository.findOne).mockResolvedValueOnce({
        ...mockMfaSecret,
        isVerified: false
      });
      
      const codes = await service.getMfaBackupCodes('user-123');
      
      expect(codes).toEqual([]);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', async () => {
      const newCodes = await service.regenerateBackupCodes('user-123');
      
      expect(newCodes).toHaveLength(10);
      expect(newCodes.every(code => code.length === 8)).toBe(true);
      expect(mfaSecretRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        { backupCodes: newCodes }
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should remove expired tokens from store', () => {
      const tokenStore = (service as any).tokenStore;
      
      // Add various tokens
      const now = new Date();
      const futureDate = new Date(now.getTime() + 3600000);
      const pastDate = new Date(now.getTime() - 3600000);
      
      tokenStore.set('valid-token', {
        userId: 'user-1',
        expiresAt: futureDate,
        type: 'email_verification'
      });
      
      tokenStore.set('expired-token-1', {
        userId: 'user-2',
        expiresAt: pastDate,
        type: 'email_verification'
      });
      
      tokenStore.set('expired-token-2', {
        userId: 'user-3',
        expiresAt: pastDate,
        type: 'password_reset'
      });
      
      expect(tokenStore.size).toBe(3);
      
      service.cleanupExpiredTokens();
      
      expect(tokenStore.size).toBe(1);
      expect(tokenStore.has('valid-token')).toBe(true);
      expect(tokenStore.has('expired-token-1')).toBe(false);
      expect(tokenStore.has('expired-token-2')).toBe(false);
    });

    it('should handle empty token store', () => {
      const tokenStore = (service as any).tokenStore;
      tokenStore.clear();
      
      expect(() => service.cleanupExpiredTokens()).not.toThrow();
      expect(tokenStore.size).toBe(0);
    });
  });
});