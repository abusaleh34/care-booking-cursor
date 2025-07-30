import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { 
  BadRequestException, 
  UnauthorizedException,
  HttpStatus 
} from '@nestjs/common';

import { AuthController } from '../../../src/auth/controllers/auth.controller';
import { AuthService } from '../../../src/auth/services/auth.service';
import { TokenService } from '../../../src/auth/services/token.service';
import { EmailService } from '../../../src/auth/services/email.service';
import { SmsService } from '../../../src/auth/services/sms.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../../src/auth/interfaces/auth.interface';

// Mock Request type
interface MockRequest {
  ip?: string;
  connection?: { remoteAddress?: string };
  get?: (header: string) => string;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let tokenService: TokenService;
  let emailService: EmailService;
  let smsService: SmsService;

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshTokens: vi.fn(),
    changePassword: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn()
  };

  const mockTokenService = {
    verifyEmailVerificationToken: vi.fn(),
    generateMfaSecret: vi.fn(),
    verifyMfaSetup: vi.fn(),
    removeMfaSecret: vi.fn(),
    getMfaBackupCodes: vi.fn(),
    regenerateBackupCodes: vi.fn()
  };

  const mockEmailService = {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn()
  };

  const mockSmsService = {
    sendVerificationCode: vi.fn(),
    verifyCode: vi.fn()
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'user@test.com',
    roles: ['customer'],
    isVerified: true,
    mfaEnabled: false
  };

  const mockRequest: MockRequest = {
    ip: '192.168.1.1',
    connection: { remoteAddress: '192.168.1.1' },
    get: vi.fn((header: string) => {
      if (header === 'User-Agent') return 'Mozilla/5.0 Test Browser';
      return '';
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        },
        {
          provide: TokenService,
          useValue: mockTokenService
        },
        {
          provide: EmailService,
          useValue: mockEmailService
        },
        {
          provide: SmsService,
          useValue: mockSmsService
        }
      ]
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);

    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@test.com',
        password: 'StrongPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'customer'
      };

      const expectedResult = {
        user: {
          id: 'user-123',
          email: 'newuser@test.com',
          isVerified: false
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123'
        }
      };

      vi.mocked(authService.register).mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto, mockRequest as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle registration errors', async () => {
      const registerDto = {
        email: 'existing@test.com',
        password: 'StrongPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      vi.mocked(authService.register).mockRejectedValue(
        new BadRequestException('Email already exists')
      );

      await expect(controller.register(registerDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle missing IP address', async () => {
      const registerDto = {
        email: 'newuser@test.com',
        password: 'StrongPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      const requestWithoutIp = {
        get: vi.fn(() => 'Mozilla/5.0 Test Browser')
      };

      vi.mocked(authService.register).mockResolvedValue({} as any);

      await controller.register(registerDto, requestWithoutIp as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '',
        'Mozilla/5.0 Test Browser'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'user@test.com',
        password: 'password123'
      };

      const expectedResult = {
        user: {
          id: 'user-123',
          email: 'user@test.com',
          isVerified: true
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123'
        }
      };

      vi.mocked(authService.login).mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest as any);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle login with MFA required', async () => {
      const loginDto = {
        email: 'user@test.com',
        password: 'password123'
      };

      const mfaResult = {
        requiresMfa: true,
        tempToken: 'temp-token-123'
      };

      vi.mocked(authService.login).mockResolvedValue(mfaResult);

      const result = await controller.login(loginDto, mockRequest as any);

      expect(result).toEqual(mfaResult);
    });

    it('should handle invalid credentials', async () => {
      const loginDto = {
        email: 'user@test.com',
        password: 'wrongpassword'
      };

      vi.mocked(authService.login).mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(controller.login(loginDto, mockRequest as any))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const body = { refreshToken: 'refresh-token-123' };

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const result = await controller.logout(body, mockUser, mockRequest as any);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        'refresh-token-123',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout errors', async () => {
      const body = { refreshToken: 'invalid-token' };

      vi.mocked(authService.logout).mockRejectedValue(
        new BadRequestException('Invalid refresh token')
      );

      await expect(controller.logout(body, mockUser, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto = {
        refreshToken: 'refresh-token-123'
      };

      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      vi.mocked(authService.refreshTokens).mockResolvedValue(expectedResult);

      const result = await controller.refreshTokens(refreshTokenDto, mockRequest as any);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'refresh-token-123',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle invalid refresh token', async () => {
      const refreshTokenDto = {
        refreshToken: 'invalid-token'
      };

      vi.mocked(authService.refreshTokens).mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refreshTokens(refreshTokenDto, mockRequest as any))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123!'
      };

      vi.mocked(authService.changePassword).mockResolvedValue(undefined);

      const result = await controller.changePassword(changePasswordDto, mockUser, mockRequest as any);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-123',
        changePasswordDto,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should handle incorrect current password', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!'
      };

      vi.mocked(authService.changePassword).mockRejectedValue(
        new BadRequestException('Current password is incorrect')
      );

      await expect(controller.changePassword(changePasswordDto, mockUser, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const dto = {
        email: 'user@test.com'
      };

      vi.mocked(authService.requestPasswordReset).mockResolvedValue(undefined);

      const result = await controller.requestPasswordReset(dto, mockRequest as any);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(
        dto,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    });

    it('should handle request for non-existent email', async () => {
      const dto = {
        email: 'nonexistent@test.com'
      };

      vi.mocked(authService.requestPasswordReset).mockResolvedValue(undefined);

      const result = await controller.requestPasswordReset(dto, mockRequest as any);

      // Should always return success message for security
      expect(result).toEqual({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    });
  });

  describe('confirmPasswordReset', () => {
    it('should confirm password reset successfully', async () => {
      const dto = {
        token: 'reset-token-123',
        newPassword: 'newPassword123!'
      };

      vi.mocked(authService.confirmPasswordReset).mockResolvedValue(undefined);

      const result = await controller.confirmPasswordReset(dto, mockRequest as any);

      expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
        dto,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should handle invalid reset token', async () => {
      const dto = {
        token: 'invalid-token',
        newPassword: 'newPassword123!'
      };

      vi.mocked(authService.confirmPasswordReset).mockRejectedValue(
        new BadRequestException('Invalid or expired reset token')
      );

      await expect(controller.confirmPasswordReset(dto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const dto = {
        token: 'verification-token-123'
      };

      vi.mocked(tokenService.verifyEmailVerificationToken).mockResolvedValue('user-123');

      const result = await controller.verifyEmail(dto);

      expect(tokenService.verifyEmailVerificationToken).toHaveBeenCalledWith('verification-token-123');
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should handle invalid verification token', async () => {
      const dto = {
        token: 'invalid-token'
      };

      vi.mocked(tokenService.verifyEmailVerificationToken).mockResolvedValue(null);

      await expect(controller.verifyEmail(dto))
        .rejects.toThrow('Invalid or expired verification token');
    });
  });

  describe('requestPhoneVerification', () => {
    it('should request phone verification successfully', async () => {
      const dto = {
        phone: '+1234567890'
      };

      vi.mocked(smsService.sendVerificationCode).mockResolvedValue({
        success: true,
        message: 'Code sent'
      });

      const result = await controller.requestPhoneVerification(dto);

      expect(smsService.sendVerificationCode).toHaveBeenCalledWith('+1234567890');
      expect(result).toEqual({ message: 'Verification code sent to your phone' });
    });

    it('should handle SMS sending errors', async () => {
      const dto = {
        phone: '+1234567890'
      };

      vi.mocked(smsService.sendVerificationCode).mockRejectedValue(
        new Error('SMS service unavailable')
      );

      await expect(controller.requestPhoneVerification(dto))
        .rejects.toThrow('SMS service unavailable');
    });
  });

  describe('verifyPhone', () => {
    it('should verify phone successfully', async () => {
      const dto = {
        phone: '+1234567890',
        code: '123456'
      };

      vi.mocked(smsService.verifyCode).mockResolvedValue(true);

      const result = await controller.verifyPhone(dto);

      expect(smsService.verifyCode).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toEqual({ message: 'Phone verified successfully' });
    });

    it('should handle invalid verification code', async () => {
      const dto = {
        phone: '+1234567890',
        code: '000000'
      };

      vi.mocked(smsService.verifyCode).mockResolvedValue(false);

      await expect(controller.verifyPhone(dto))
        .rejects.toThrow('Invalid verification code');
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA successfully', async () => {
      const dto = {
        password: 'password123'
      };

      const mfaData = {
        secret: 'SECRET123',
        qrCodeUrl: 'https://example.com/qr',
        backupCodes: ['CODE1', 'CODE2']
      };

      vi.mocked(tokenService.generateMfaSecret).mockResolvedValue(mfaData);

      const result = await controller.enableMfa(dto, mockUser);

      expect(tokenService.generateMfaSecret).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        message: 'MFA setup initiated',
        secret: 'SECRET123',
        qrCodeUrl: 'https://example.com/qr',
        backupCodes: ['CODE1', 'CODE2']
      });
    });
  });

  describe('verifyMfaSetup', () => {
    it('should verify MFA setup successfully', async () => {
      const dto = {
        code: '123456'
      };

      vi.mocked(tokenService.verifyMfaSetup).mockResolvedValue(true);

      const result = await controller.verifyMfaSetup(dto, mockUser);

      expect(tokenService.verifyMfaSetup).toHaveBeenCalledWith('user-123', '123456');
      expect(result).toEqual({ message: 'MFA enabled successfully' });
    });

    it('should handle invalid MFA code', async () => {
      const dto = {
        code: '000000'
      };

      vi.mocked(tokenService.verifyMfaSetup).mockResolvedValue(false);

      await expect(controller.verifyMfaSetup(dto, mockUser))
        .rejects.toThrow('Invalid MFA code');
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA successfully', async () => {
      const dto = {
        password: 'password123',
        mfaCode: '123456'
      };

      vi.mocked(tokenService.removeMfaSecret).mockResolvedValue(undefined);

      const result = await controller.disableMfa(dto, mockUser);

      expect(tokenService.removeMfaSecret).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'MFA disabled successfully' });
    });
  });

  describe('getBackupCodes', () => {
    it('should get backup codes successfully', async () => {
      const backupCodes = ['CODE1', 'CODE2', 'CODE3'];

      vi.mocked(tokenService.getMfaBackupCodes).mockResolvedValue(backupCodes);

      const result = await controller.getBackupCodes(mockUser);

      expect(tokenService.getMfaBackupCodes).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ backupCodes });
    });

    it('should handle empty backup codes', async () => {
      vi.mocked(tokenService.getMfaBackupCodes).mockResolvedValue([]);

      const result = await controller.getBackupCodes(mockUser);

      expect(result).toEqual({ backupCodes: [] });
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate backup codes successfully', async () => {
      const newBackupCodes = ['NEWCODE1', 'NEWCODE2', 'NEWCODE3'];

      vi.mocked(tokenService.regenerateBackupCodes).mockResolvedValue(newBackupCodes);

      const result = await controller.regenerateBackupCodes(mockUser);

      expect(tokenService.regenerateBackupCodes).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ backupCodes: newBackupCodes });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('error handling', () => {
    it('should handle service errors appropriately', async () => {
      const loginDto = {
        email: 'user@test.com',
        password: 'password123'
      };

      vi.mocked(authService.login).mockRejectedValue(
        new Error('Unexpected error')
      );

      await expect(controller.login(loginDto, mockRequest as any))
        .rejects.toThrow('Unexpected error');
    });

    it('should handle malformed request data', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: ''
      };

      vi.mocked(authService.login).mockRejectedValue(
        new BadRequestException('Invalid request data')
      );

      await expect(controller.login(invalidDto, mockRequest as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('IP and User Agent extraction', () => {
    it('should extract IP from req.ip', async () => {
      const request = {
        ip: '10.0.0.1',
        get: vi.fn(() => 'Test Agent')
      };

      const registerDto = {
        email: 'user@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      vi.mocked(authService.register).mockResolvedValue({} as any);

      await controller.register(registerDto, request as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '10.0.0.1',
        'Test Agent'
      );
    });

    it('should extract IP from connection.remoteAddress when req.ip is missing', async () => {
      const request = {
        connection: { remoteAddress: '172.16.0.1' },
        get: vi.fn(() => 'Test Agent')
      };

      const registerDto = {
        email: 'user@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      vi.mocked(authService.register).mockResolvedValue({} as any);

      await controller.register(registerDto, request as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '172.16.0.1',
        'Test Agent'
      );
    });

    it('should handle missing User-Agent header', async () => {
      const request = {
        ip: '192.168.1.1',
        get: vi.fn(() => undefined)
      };

      const registerDto = {
        email: 'user@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      };

      vi.mocked(authService.register).mockResolvedValue({} as any);

      await controller.register(registerDto, request as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto,
        '192.168.1.1',
        ''
      );
    });
  });
});