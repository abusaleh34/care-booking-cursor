import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from '../../../src/auth/services/auth.service';
import { TokenService } from '../../../src/auth/services/token.service';
import { AuditService } from '../../../src/auth/services/audit.service';
import { EmailService } from '../../../src/auth/services/email.service';
import { PasswordService } from '../../../src/auth/services/password.service';
import { SmsService } from '../../../src/auth/services/sms.service';
import { User } from '../../../src/database/entities/user.entity';
import { UserProfile } from '../../../src/database/entities/user-profile.entity';
import { UserRole } from '../../../src/database/entities/user-role.entity';
import { RefreshToken } from '../../../src/database/entities/refresh-token.entity';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt');

describe('AuthService - Registration Tests', () => {
  let service: AuthService;
  let userRepository;
  let serviceProviderRepository;
  let tokenService;
  let emailService;
  let smsService;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const mockServiceProviderRepository = {
      create: vi.fn(),
      save: vi.fn(),
    };

    const mockTokenService = {
      generateTokens: vi.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
      generateEmailVerificationToken: vi.fn().mockResolvedValue('verification-token'),
    };

    const mockEmailService = {
      sendVerificationEmail: vi.fn(),
      sendWelcomeEmail: vi.fn(),
    };

    const mockSmsService = {
      sendVerificationCode: vi.fn(),
      sendWelcomeSms: vi.fn(),
    };

    const mockAuditService = {
      log: vi.fn(),
    };

    const mockPasswordService = {
      validatePasswordStrength: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
      hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(UserProfile), useValue: { create: vi.fn(), save: vi.fn() } },
        { provide: getRepositoryToken(UserRole), useValue: { create: vi.fn(), save: vi.fn() } },
        { provide: getRepositoryToken(RefreshToken), useValue: { create: vi.fn(), save: vi.fn() } },
        { provide: getRepositoryToken(ServiceProvider), useValue: mockServiceProviderRepository },
        { provide: TokenService, useValue: mockTokenService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: 'JwtService', useValue: { sign: vi.fn() } },
        { provide: 'ConfigService', useValue: { get: vi.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    serviceProviderRepository = module.get(getRepositoryToken(ServiceProvider));
    tokenService = module.get(TokenService);
    emailService = module.get(EmailService);
    smsService = module.get(SmsService);

    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
  });

  describe('Customer Registration', () => {
    const customerRegisterDto = {
      email: 'customer@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Customer',
      phone: '+1234567890',
      role: 'customer',
    };

    it('should successfully register a new customer', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-123',
        email: customerRegisterDto.email,
        profile: { firstName: 'John', lastName: 'Customer' },
        roles: [{ roleType: 'customer' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(customerRegisterDto, '127.0.0.1', 'test-agent');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(customerRegisterDto.email);
      expect(result.user.roles[0]).toHaveProperty('roleType', 'customer');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should handle duplicate email registration', async () => {
      const existingUser = { email: customerRegisterDto.email };
      userRepository.findOne.mockResolvedValue(existingUser);

      await expect(
        service.register(customerRegisterDto, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(ConflictException);
    });

    it('should validate required fields for customer registration', async () => {
      const incompleteDto = {
        email: 'customer@example.com',
        password: 'SecurePass123!',
        // Missing firstName, lastName
        role: 'customer',
      };

      await expect(
        service.register(incompleteDto as any, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });

    it('should send SMS verification if phone is provided', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-123',
        email: customerRegisterDto.email,
        phone: customerRegisterDto.phone,
        profile: { firstName: 'John', lastName: 'Customer' },
        roles: [{ roleType: 'customer' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.register(customerRegisterDto, '127.0.0.1', 'test-agent');

      expect(smsService.sendVerificationCode).toHaveBeenCalledWith(customerRegisterDto.phone);
    });
  });

  describe('Provider Registration', () => {
    const providerRegisterDto = {
      email: 'provider@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Provider',
      phone: '+1234567890',
      role: 'provider',
      businessName: 'Jane\'s Beauty Services',
      businessDescription: 'Professional beauty services',
      businessAddress: '123 Main St, City, State',
    };

    it('should successfully register a new provider', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-456',
        email: providerRegisterDto.email,
        profile: { firstName: 'Jane', lastName: 'Provider' },
        roles: [{ roleType: 'provider' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      serviceProviderRepository.create.mockReturnValue({
        id: 'provider-123',
        user: mockUser,
        businessName: providerRegisterDto.businessName,
      });
      serviceProviderRepository.save.mockResolvedValue({
        id: 'provider-123',
        user: mockUser,
        businessName: providerRegisterDto.businessName,
      });

      const result = await service.register(providerRegisterDto, '127.0.0.1', 'test-agent');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(providerRegisterDto.email);
      expect(serviceProviderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: providerRegisterDto.businessName,
          businessDescription: providerRegisterDto.businessDescription,
        })
      );
    });

    it('should require business information for provider registration', async () => {
      const incompleteProviderDto = {
        email: 'provider@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Provider',
        role: 'provider',
        // Missing businessName
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.register(incompleteProviderDto as any, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });

    it('should set provider as unverified initially', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-456',
        email: providerRegisterDto.email,
        profile: { firstName: 'Jane', lastName: 'Provider' },
        roles: [{ roleType: 'provider' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      
      const savedProvider = {
        id: 'provider-123',
        user: mockUser,
        businessName: providerRegisterDto.businessName,
        isVerified: false,
        verificationStatus: 'pending',
      };
      serviceProviderRepository.create.mockReturnValue(savedProvider);
      serviceProviderRepository.save.mockResolvedValue(savedProvider);

      await service.register(providerRegisterDto, '127.0.0.1', 'test-agent');

      expect(serviceProviderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: false,
          verificationStatus: 'pending',
        })
      );
    });
  });

  describe('Password Validation', () => {
    it('should reject weak passwords', async () => {
      const weakPasswordDto = {
        email: 'user@example.com',
        password: '123456', // Weak password
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.register(weakPasswordDto, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });

    it('should enforce password complexity requirements', async () => {
      const testCases = [
        { password: 'short', shouldFail: true }, // Too short
        { password: 'nouppercase123!', shouldFail: true }, // No uppercase
        { password: 'NOLOWERCASE123!', shouldFail: true }, // No lowercase
        { password: 'NoNumbers!', shouldFail: true }, // No numbers
        { password: 'NoSpecial123', shouldFail: true }, // No special chars
        { password: 'ValidPass123!', shouldFail: false }, // Valid
      ];

      for (const testCase of testCases) {
        const dto = {
          email: `user${Math.random()}@example.com`,
          password: testCase.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'customer',
        };

        userRepository.findOne.mockResolvedValue(null);

        if (testCase.shouldFail) {
          await expect(
            service.register(dto, '127.0.0.1', 'test-agent')
          ).rejects.toThrow();
        }
      }
    });
  });

  describe('Email Verification', () => {
    it('should send verification email after registration', async () => {
      const dto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: 'customer',
      };

      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-789',
        email: dto.email,
        profile: { firstName: dto.firstName, lastName: dto.lastName },
        roles: [{ roleType: 'customer' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.register(dto, '127.0.0.1', 'test-agent');

      expect(tokenService.generateEmailVerificationToken).toHaveBeenCalledWith(mockUser.id);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        expect.objectContaining({
          firstName: dto.firstName,
        }),
        'verification-token'
      );
    });

    it('should set user as unverified initially', async () => {
      const dto = {
        email: 'unverified@example.com',
        password: 'SecurePass123!',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'customer',
      };

      userRepository.findOne.mockResolvedValue(null);
      const mockUser = {
        id: 'user-unverified',
        email: dto.email,
        isVerified: false,
        profile: { firstName: dto.firstName, lastName: dto.lastName },
        roles: [{ roleType: 'customer' }],
      };
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(dto, '127.0.0.1', 'test-agent');

      expect(result.user.isVerified).toBe(false);
    });
  });

  describe('Role-based Registration', () => {
    it('should reject invalid roles', async () => {
      const invalidRoleDto = {
        email: 'invalid@example.com',
        password: 'SecurePass123!',
        firstName: 'Invalid',
        lastName: 'Role',
        role: 'superadmin', // Invalid role
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.register(invalidRoleDto as any, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });

    it('should not allow admin registration through public endpoint', async () => {
      const adminDto = {
        email: 'admin@example.com',
        password: 'SecurePass123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.register(adminDto as any, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Registration Prevention', () => {
    it('should handle race condition for duplicate email registration', async () => {
      const dto = {
        email: 'race@example.com',
        password: 'SecurePass123!',
        firstName: 'Race',
        lastName: 'Condition',
        role: 'customer',
      };

      // First check returns null, but save throws unique constraint error
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue({} as any);
      userRepository.save.mockRejectedValue(new Error('Unique constraint violation'));

      await expect(
        service.register(dto, '127.0.0.1', 'test-agent')
      ).rejects.toThrow();
    });
  });
}); 