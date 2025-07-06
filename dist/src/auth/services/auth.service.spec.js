"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
jest.mock('bcrypt');
const bcrypt = require("bcrypt");
const auth_service_1 = require("./auth.service");
const token_service_1 = require("./token.service");
const audit_service_1 = require("./audit.service");
const email_service_1 = require("./email.service");
const password_service_1 = require("./password.service");
const sms_service_1 = require("./sms.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../../database/entities/user.entity");
const user_profile_entity_1 = require("../../database/entities/user-profile.entity");
const user_role_entity_1 = require("../../database/entities/user-role.entity");
const refresh_token_entity_1 = require("../../database/entities/refresh-token.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
describe('AuthService', () => {
    let service;
    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: null,
        passwordHash: 'hashed-password',
        isVerified: true,
        isActive: true,
        mfaEnabled: false,
        lastLoginAt: null,
        lastLoginIp: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
            firstName: 'John',
            lastName: 'Doe',
            avatarUrl: null,
        },
        roles: [{ roleType: 'customer', isActive: true }],
        refreshTokens: [],
        auditLogs: [],
        mfaSecret: null,
        customerReviews: [],
        isLocked: false,
        hasRole: () => true,
    };
    const mockUserRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };
    const mockTokenService = {
        generateTokens: jest.fn(),
        verifyMfaCode: jest.fn(),
        generateEmailVerificationToken: jest.fn().mockResolvedValue('verification-token'),
        generatePasswordResetToken: jest.fn().mockResolvedValue('reset-token'),
        verifyEmailVerificationToken: jest.fn(),
        verifyPasswordResetToken: jest.fn(),
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    const mockEmailService = {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
    };
    const mockPasswordService = {
        hashPassword: jest.fn(),
        comparePassword: jest.fn(),
        validatePasswordStrength: jest.fn(),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        bcrypt.hash.mockResolvedValue('hashed-password');
        bcrypt.compare.mockResolvedValue(true);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: mockUserRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_profile_entity_1.UserProfile),
                    useValue: {
                        create: jest.fn().mockImplementation((data) => ({ ...data, id: 'profile-id' })),
                        save: jest.fn().mockImplementation((profile) => Promise.resolve(profile)),
                    },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_role_entity_1.UserRole),
                    useValue: {
                        create: jest.fn().mockImplementation((data) => ({ ...data, id: 'role-id' })),
                        save: jest.fn().mockImplementation((role) => Promise.resolve(role)),
                    },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(refresh_token_entity_1.RefreshToken),
                    useValue: {
                        create: jest.fn().mockImplementation((data) => ({ ...data, id: 'token-id' })),
                        save: jest.fn().mockImplementation((token) => Promise.resolve(token)),
                        update: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: jwt_1.JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mocked-token'),
                    },
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key) => {
                            const config = {
                                JWT_EXPIRES_IN: '15m',
                                JWT_REFRESH_EXPIRES_IN: '7d',
                                JWT_REFRESH_SECRET: 'refresh-secret',
                            };
                            return config[key];
                        }),
                    },
                },
                {
                    provide: sms_service_1.SmsService,
                    useValue: {
                        sendVerificationCode: jest.fn(),
                        verifyCode: jest.fn(),
                    },
                },
                {
                    provide: token_service_1.TokenService,
                    useValue: mockTokenService,
                },
                {
                    provide: audit_service_1.AuditService,
                    useValue: mockAuditService,
                },
                {
                    provide: email_service_1.EmailService,
                    useValue: mockEmailService,
                },
                {
                    provide: password_service_1.PasswordService,
                    useValue: mockPasswordService,
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };
        const ipAddress = '127.0.0.1';
        const userAgent = 'test-agent';
        it('should successfully login a valid user', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            mockTokenService.generateTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
            const result = await service.login(loginDto, ipAddress, userAgent);
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe(mockUser.email);
            expect(mockAuditService.log).toHaveBeenCalledWith({
                userId: mockUser.id,
                action: audit_log_entity_1.AuditAction.LOGIN,
                description: 'User logged in successfully',
                ipAddress,
                userAgent,
            });
        });
        it('should throw UnauthorizedException for invalid credentials', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(common_1.UnauthorizedException);
            expect(mockAuditService.log).toHaveBeenCalledWith({
                action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
                description: `Failed login attempt for ${loginDto.email}`,
                ipAddress,
                userAgent,
                metadata: { reason: 'user_not_found' },
            });
        });
        it('should throw ForbiddenException for locked account', async () => {
            const lockedUser = {
                ...mockUser,
                lockedUntil: new Date(Date.now() + 3600000),
                isLocked: true,
            };
            mockUserRepository.findOne.mockResolvedValue(lockedUser);
            await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should throw ForbiddenException for inactive account', async () => {
            const inactiveUser = { ...mockUser, isActive: false };
            mockUserRepository.findOne.mockResolvedValue(inactiveUser);
            await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should handle MFA verification', async () => {
            const mfaUser = { ...mockUser, mfaEnabled: true };
            const loginDtoWithMfa = { ...loginDto, mfaCode: '123456' };
            mockUserRepository.findOne.mockResolvedValue(mfaUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            mockTokenService.verifyMfaCode.mockResolvedValue(true);
            mockTokenService.generateTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
            const result = await service.login(loginDtoWithMfa, ipAddress, userAgent);
            expect(result).toHaveProperty('accessToken');
            expect(mockTokenService.verifyMfaCode).toHaveBeenCalledWith(mfaUser.id, '123456');
        });
        it('should require MFA code when MFA is enabled', async () => {
            const mfaUser = { ...mockUser, mfaEnabled: true };
            mockUserRepository.findOne.mockResolvedValue(mfaUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should handle failed login attempts', async () => {
            const user = { ...mockUser };
            mockUserRepository.findOne.mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(common_1.UnauthorizedException);
            expect(mockUserRepository.update).toHaveBeenCalled();
            expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
                description: expect.stringContaining('Failed login attempt'),
            }));
        });
    });
    describe('register', () => {
        const registerDto = {
            email: 'newuser@example.com',
            password: 'SecurePass123!',
            firstName: 'Jane',
            lastName: 'Doe',
        };
        const ipAddress = '127.0.0.1';
        const userAgent = 'test-agent';
        it('should successfully register a new user', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            mockPasswordService.validatePasswordStrength.mockReturnValue({
                isValid: true,
                errors: [],
            });
            mockPasswordService.hashPassword.mockResolvedValue('hashed-password');
            const newUser = { ...mockUser, id: 'new-user-id' };
            mockUserRepository.create.mockReturnValue(newUser);
            mockUserRepository.save.mockResolvedValue(newUser);
            mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
            const result = await service.register(registerDto, ipAddress, userAgent);
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result).toHaveProperty('user');
            expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
        });
        it('should throw BadRequestException for existing user', async () => {
            const existingUserWithSameEmail = { ...mockUser, email: registerDto.email };
            mockUserRepository.findOne.mockResolvedValue(existingUserWithSameEmail);
            await expect(service.register(registerDto, ipAddress, userAgent)).rejects.toThrow(common_1.ConflictException);
        });
        it.skip('should throw BadRequestException for weak password', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);
            mockPasswordService.validatePasswordStrength.mockReturnValue({
                isValid: false,
                errors: ['Password must contain uppercase letter'],
            });
            await expect(service.register(registerDto, ipAddress, userAgent)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map