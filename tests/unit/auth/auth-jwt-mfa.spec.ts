import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenService } from '../../../src/auth/services/token.service';
import { User } from '../../../src/database/entities/user.entity';
import { RefreshToken } from '../../../src/database/entities/refresh-token.entity';
import { MfaSecret } from '../../../src/database/entities/mfa-secret.entity';
import * as speakeasy from 'speakeasy';

vi.mock('speakeasy');

describe('Token Service - JWT & MFA Tests', () => {
  let service: TokenService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository;
  let refreshTokenRepository;
  let mfaSecretRepository;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: [{ roleType: 'customer', isActive: true }],
    isVerified: true,
    isActive: true,
    mfaEnabled: false,
  };

  beforeEach(async () => {
    const mockJwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_REFRESH_EXPIRES_IN: '7d',
          MFA_APP_NAME: 'Care Services',
        };
        return config[key];
      }),
    };

    const mockUserRepository = {
      findOne: vi.fn(),
      update: vi.fn(),
      save: vi.fn(),
    };

    const mockRefreshTokenRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const mockMfaSecretRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
        { provide: getRepositoryToken(MfaSecret), useValue: mockMfaSecretRepository },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get(getRepositoryToken(User));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    mfaSecretRepository = module.get(getRepositoryToken(MfaSecret));

    vi.clearAllMocks();
  });

  describe('JWT Token Generation', () => {
    it('should generate access and refresh tokens', async () => {
      const deviceInfo = 'Mozilla/5.0 Test Browser';
      const ipAddress = '127.0.0.1';

      vi.mocked(jwtService.sign).mockReturnValueOnce('access-token-123');
      vi.mocked(jwtService.sign).mockReturnValueOnce('refresh-token-123');

      const mockRefreshToken = {
        id: 'token-123',
        token: 'refresh-token-123',
        user: mockUser,
        deviceInfo,
        ipAddress,
        expiresAt: expect.any(Date),
      };

      refreshTokenRepository.create.mockReturnValue(mockRefreshToken);
      refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.generateTokens(mockUser, deviceInfo, ipAddress);

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          roles: ['customer'],
        },
        {
          secret: 'test-secret',
          expiresIn: '15m',
        }
      );

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        {
          secret: 'refresh-secret',
          expiresIn: '7d',
        }
      );
    });

    it('should handle multiple roles in token payload', async () => {
      const multiRoleUser = {
        ...mockUser,
        roles: [
          { roleType: 'customer', isActive: true },
          { roleType: 'provider', isActive: true },
        ],
      };

      vi.mocked(jwtService.sign).mockReturnValueOnce('access-token-multi');
      vi.mocked(jwtService.sign).mockReturnValueOnce('refresh-token-multi');
      refreshTokenRepository.create.mockReturnValue({} as any);
      refreshTokenRepository.save.mockResolvedValue({} as any);

      await service.generateTokens(multiRoleUser, 'device', '127.0.0.1');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: ['customer', 'provider'],
        }),
        expect.any(Object)
      );
    });

    it('should clean up old refresh tokens if limit exceeded', async () => {
      const existingTokens = Array(5).fill(null).map((_, i) => ({
        id: `token-${i}`,
        createdAt: new Date(Date.now() - i * 1000000),
      }));

      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        refreshTokens: existingTokens,
      });

      vi.mocked(jwtService.sign).mockReturnValue('token');
      refreshTokenRepository.create.mockReturnValue({} as any);
      refreshTokenRepository.save.mockResolvedValue({} as any);

      await service.generateTokens(mockUser, 'device', '127.0.0.1');

      // Should delete oldest tokens when limit is exceeded
      expect(refreshTokenRepository.delete).toHaveBeenCalled();
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', async () => {
      const token = 'valid-access-token';
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['customer'],
      };

      vi.mocked(jwtService.verify).mockReturnValue(payload);

      const result = await service.verifyAccessToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'test-secret',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      vi.mocked(jwtService.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyAccessToken(token)).rejects.toThrow(UnauthorizedException);
    });

    it('should verify refresh token and return associated user', async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenRecord = {
        id: 'token-123',
        token: refreshToken,
        user: mockUser,
        expiresAt: new Date(Date.now() + 1000000),
        revokedAt: null,
      };

      refreshTokenRepository.findOne.mockResolvedValue(tokenRecord);

      const result = await service.verifyRefreshToken(refreshToken);

      expect(result).toEqual(mockUser);
    });

    it('should reject expired refresh token', async () => {
      const refreshToken = 'expired-refresh-token';
      const tokenRecord = {
        id: 'token-123',
        token: refreshToken,
        user: mockUser,
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
      };

      refreshTokenRepository.findOne.mockResolvedValue(tokenRecord);

      await expect(service.verifyRefreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject revoked refresh token', async () => {
      const refreshToken = 'revoked-refresh-token';
      const tokenRecord = {
        id: 'token-123',
        token: refreshToken,
        user: mockUser,
        expiresAt: new Date(Date.now() + 1000000),
        revokedAt: new Date(), // Revoked
      };

      refreshTokenRepository.findOne.mockResolvedValue(tokenRecord);

      await expect(service.verifyRefreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Multi-Factor Authentication', () => {
    it('should generate MFA secret and QR code', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUrl = 'otpauth://totp/Care%20Services:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Care%20Services';

      vi.mocked(speakeasy.generateSecret).mockReturnValue({
        base32: secret,
        otpauth_url: qrCodeUrl,
      } as any);

      mfaSecretRepository.findOne.mockResolvedValue(null);
      mfaSecretRepository.create.mockReturnValue({
        id: 'mfa-123',
        user: mockUser,
        secret,
        isActive: false,
      });
      mfaSecretRepository.save.mockResolvedValue({
        id: 'mfa-123',
        user: mockUser,
        secret,
        isActive: false,
      });

      const result = await service.generateMfaSecret(mockUser.id);

      expect(result).toEqual({
        secret,
        qrCodeUrl,
        backupCodes: expect.any(Array),
      });

      expect(result.backupCodes).toHaveLength(10);
      expect(mfaSecretRepository.save).toHaveBeenCalled();
    });

    it('should not generate new MFA secret if already exists', async () => {
      const existingSecret = {
        id: 'mfa-existing',
        user: mockUser,
        secret: 'EXISTING_SECRET',
        isActive: true,
      };

      mfaSecretRepository.findOne.mockResolvedValue(existingSecret);

      await expect(service.generateMfaSecret(mockUser.id)).rejects.toThrow(BadRequestException);
    });

    it('should verify valid MFA code', async () => {
      const mfaCode = '123456';
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: true,
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);

      const result = await service.verifyMfaCode(mockUser.id, mfaCode);

      expect(result).toBe(true);
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'SECRET123',
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });
    });

    it('should verify backup code and mark as used', async () => {
      const backupCode = 'BACKUP123';
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: true,
        backupCodes: ['BACKUP123', 'BACKUP456'],
        usedBackupCodes: [],
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);
      mfaSecretRepository.save.mockResolvedValue({
        ...mfaSecret,
        usedBackupCodes: ['BACKUP123'],
      });

      const result = await service.verifyMfaCode(mockUser.id, backupCode);

      expect(result).toBe(true);
      expect(mfaSecretRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedBackupCodes: ['BACKUP123'],
        })
      );
    });

    it('should reject already used backup code', async () => {
      const backupCode = 'USED123';
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: true,
        backupCodes: ['USED123', 'BACKUP456'],
        usedBackupCodes: ['USED123'], // Already used
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);

      const result = await service.verifyMfaCode(mockUser.id, backupCode);

      expect(result).toBe(false);
    });

    it('should verify MFA setup with valid code', async () => {
      const setupCode = '123456';
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: false, // Not active yet
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);
      mfaSecretRepository.save.mockResolvedValue({
        ...mfaSecret,
        isActive: true,
      });
      userRepository.update.mockResolvedValue({});

      const result = await service.verifyMfaSetup(mockUser.id, setupCode);

      expect(result).toBe(true);
      expect(mfaSecretRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        mfaEnabled: true,
      });
    });

    it('should regenerate backup codes', async () => {
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: true,
        backupCodes: ['OLD1', 'OLD2'],
        usedBackupCodes: ['OLD1'],
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);
      mfaSecretRepository.save.mockImplementation((secret) => Promise.resolve(secret));

      const result = await service.regenerateBackupCodes(mockUser.id);

      expect(result).toHaveLength(10);
      expect(mfaSecretRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          backupCodes: expect.any(Array),
          usedBackupCodes: [], // Reset used codes
        })
      );
    });

    it('should remove MFA secret and disable MFA', async () => {
      const mfaSecret = {
        id: 'mfa-123',
        user: mockUser,
        secret: 'SECRET123',
        isActive: true,
      };

      mfaSecretRepository.findOne.mockResolvedValue(mfaSecret);
      mfaSecretRepository.delete.mockResolvedValue({} as any);
      userRepository.update.mockResolvedValue({} as any);

      await service.removeMfaSecret(mockUser.id);

      expect(mfaSecretRepository.delete).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        mfaEnabled: false,
      });
    });
  });

  describe('Token Revocation', () => {
    it('should revoke refresh token', async () => {
      const refreshToken = 'token-to-revoke';
      const tokenRecord = {
        id: 'token-123',
        token: refreshToken,
        user: mockUser,
        revokedAt: null,
      };

      refreshTokenRepository.findOne.mockResolvedValue(tokenRecord);
      refreshTokenRepository.update.mockResolvedValue({} as any);

      await service.revokeRefreshToken(refreshToken);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        tokenRecord.id,
        expect.objectContaining({
          revokedAt: expect.any(Date),
        })
      );
    });

    it('should revoke all user tokens', async () => {
      await service.revokeAllUserTokens(mockUser.id);

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: mockUser.id, revokedAt: null },
        { revokedAt: expect.any(Date) }
      );
    });
  });

  describe('Email Verification Token', () => {
    it('should generate email verification token', async () => {
      vi.mocked(jwtService.sign).mockReturnValue('email-verification-token');

      const result = await service.generateEmailVerificationToken(mockUser.id);

      expect(result).toBe('email-verification-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, type: 'email-verification' },
        { secret: 'test-secret', expiresIn: '24h' }
      );
    });

    it('should verify email verification token', async () => {
      const token = 'valid-email-token';
      const payload = {
        sub: 'user-123',
        type: 'email-verification',
      };

      vi.mocked(jwtService.verify).mockReturnValue(payload);
      userRepository.update.mockResolvedValue({} as any);

      const result = await service.verifyEmailVerificationToken(token);

      expect(result).toBe('user-123');
      expect(userRepository.update).toHaveBeenCalledWith('user-123', {
        isVerified: true,
      });
    });

    it('should reject invalid email verification token', async () => {
      const token = 'invalid-email-token';

      vi.mocked(jwtService.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.verifyEmailVerificationToken(token);

      expect(result).toBeNull();
    });
  });

  describe('Password Reset Token', () => {
    it('should generate password reset token', async () => {
      const email = 'test@example.com';
      vi.mocked(jwtService.sign).mockReturnValue('reset-token');

      const result = await service.generatePasswordResetToken(email);

      expect(result).toBe('reset-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { email, type: 'password-reset' },
        { secret: 'test-secret', expiresIn: '1h' }
      );
    });

    it('should verify password reset token', async () => {
      const token = 'valid-reset-token';
      const payload = {
        email: 'test@example.com',
        type: 'password-reset',
      };

      vi.mocked(jwtService.verify).mockReturnValue(payload);

      const result = await service.verifyPasswordResetToken(token);

      expect(result).toBe('test@example.com');
    });

    it('should reject invalid password reset token type', async () => {
      const token = 'wrong-type-token';
      const payload = {
        email: 'test@example.com',
        type: 'email-verification', // Wrong type
      };

      vi.mocked(jwtService.verify).mockReturnValue(payload);

      const result = await service.verifyPasswordResetToken(token);

      expect(result).toBeNull();
    });
  });
}); 