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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../../database/entities/user.entity");
const user_profile_entity_1 = require("../../database/entities/user-profile.entity");
const user_role_entity_1 = require("../../database/entities/user-role.entity");
const refresh_token_entity_1 = require("../../database/entities/refresh-token.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
const audit_service_1 = require("./audit.service");
const token_service_1 = require("./token.service");
let AuthService = class AuthService {
    constructor(userRepository, userProfileRepository, userRoleRepository, refreshTokenRepository, jwtService, configService, emailService, smsService, auditService, tokenService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userRoleRepository = userRoleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.auditService = auditService;
        this.tokenService = tokenService;
    }
    async register(registerDto, ipAddress, userAgent) {
        const { email, phone, password, firstName, lastName, ...profileData } = registerDto;
        const existingUser = await this.userRepository.findOne({
            where: [{ email }, ...(phone ? [{ phone }] : [])],
        });
        if (existingUser) {
            if (existingUser.email === email) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            if (existingUser.phone === phone) {
                throw new common_1.ConflictException('User with this phone number already exists');
            }
        }
        const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS')) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const user = this.userRepository.create({
            email,
            phone,
            passwordHash,
            isVerified: false,
            isActive: true,
        });
        const savedUser = await this.userRepository.save(user);
        const profile = this.userProfileRepository.create({
            userId: savedUser.id,
            firstName,
            lastName,
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
            gender: profileData.gender,
            timezone: profileData.timezone,
            languagePreference: profileData.languagePreference || 'en',
        });
        await this.userProfileRepository.save(profile);
        const userRole = this.userRoleRepository.create({
            userId: savedUser.id,
            roleType: user_role_entity_1.RoleType.CUSTOMER,
            isActive: true,
        });
        await this.userRoleRepository.save(userRole);
        const verificationToken = await this.tokenService.generateEmailVerificationToken(savedUser.id);
        await this.emailService.sendVerificationEmail(savedUser.email, verificationToken);
        await this.auditService.log({
            userId: savedUser.id,
            action: audit_log_entity_1.AuditAction.REGISTER,
            description: 'User registered successfully',
            ipAddress,
            userAgent,
        });
        const tokens = await this.generateTokens(savedUser.id, ipAddress, userAgent);
        return {
            ...tokens,
            user: {
                id: savedUser.id,
                email: savedUser.email,
                isVerified: savedUser.isVerified,
                mfaEnabled: savedUser.mfaEnabled,
                profile: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    avatarUrl: profile.avatarUrl,
                },
                roles: [user_role_entity_1.RoleType.CUSTOMER],
            },
        };
    }
    async login(loginDto, ipAddress, userAgent) {
        const { email, phone, password, mfaCode } = loginDto;
        if (!email && !phone) {
            throw new common_1.BadRequestException('Email or phone number is required');
        }
        const user = await this.userRepository.findOne({
            where: email ? { email } : { phone },
            relations: ['profile', 'roles', 'mfaSecret'],
        });
        if (!user) {
            await this.auditService.log({
                action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
                description: `Failed login attempt for ${email || phone}`,
                ipAddress,
                userAgent,
                metadata: { reason: 'user_not_found' },
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isLocked) {
            await this.auditService.log({
                userId: user.id,
                action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
                description: 'Login attempt on locked account',
                ipAddress,
                userAgent,
                metadata: { reason: 'account_locked' },
            });
            throw new common_1.ForbiddenException('Account is temporarily locked. Please try again later.');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Account is deactivated');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.handleFailedLogin(user, ipAddress, userAgent);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.mfaEnabled) {
            if (!mfaCode) {
                throw new common_1.BadRequestException('MFA code is required');
            }
            const isMfaValid = await this.tokenService.verifyMfaCode(user.id, mfaCode);
            if (!isMfaValid) {
                await this.auditService.log({
                    userId: user.id,
                    action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
                    description: 'Invalid MFA code provided',
                    ipAddress,
                    userAgent,
                    metadata: { reason: 'invalid_mfa' },
                });
                throw new common_1.UnauthorizedException('Invalid MFA code');
            }
        }
        if (user.failedLoginAttempts > 0) {
            await this.userRepository.update(user.id, {
                failedLoginAttempts: 0,
                lockedUntil: null,
            });
        }
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        });
        await this.auditService.log({
            userId: user.id,
            action: audit_log_entity_1.AuditAction.LOGIN,
            description: 'User logged in successfully',
            ipAddress,
            userAgent,
        });
        const tokens = await this.generateTokens(user.id, ipAddress, userAgent);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                isVerified: user.isVerified,
                mfaEnabled: user.mfaEnabled,
                profile: {
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    avatarUrl: user.profile.avatarUrl,
                },
                roles: user.roles.filter((role) => role.isActive).map((role) => role.roleType),
            },
        };
    }
    async logout(userId, refreshToken, ipAddress, userAgent) {
        await this.refreshTokenRepository.update({ userId, token: refreshToken }, { isRevoked: true, revokedAt: new Date() });
        await this.auditService.log({
            userId,
            action: audit_log_entity_1.AuditAction.LOGOUT,
            description: 'User logged out',
            ipAddress,
            userAgent,
        });
    }
    async changePassword(userId, changePasswordDto, ipAddress, userAgent) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('New password and confirmation do not match');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const saltRounds = this.configService.get('BCRYPT_ROUNDS') || 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.userRepository.update(userId, { passwordHash: newPasswordHash });
        await this.refreshTokenRepository.update({ userId }, { isRevoked: true, revokedAt: new Date() });
        await this.auditService.log({
            userId,
            action: audit_log_entity_1.AuditAction.PASSWORD_CHANGE,
            description: 'Password changed successfully',
            ipAddress,
            userAgent,
        });
        await this.emailService.sendPasswordChangeNotification(user.email);
    }
    async requestPasswordReset(dto, ipAddress, userAgent) {
        const { email } = dto;
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            return;
        }
        const resetToken = await this.tokenService.generatePasswordResetToken(user.id);
        await this.emailService.sendPasswordResetEmail(email, resetToken);
        await this.auditService.log({
            userId: user.id,
            action: audit_log_entity_1.AuditAction.PASSWORD_RESET,
            description: 'Password reset requested',
            ipAddress,
            userAgent,
        });
    }
    async confirmPasswordReset(dto, ipAddress, userAgent) {
        const { token, newPassword, confirmPassword } = dto;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException('New password and confirmation do not match');
        }
        const userId = await this.tokenService.verifyPasswordResetToken(token);
        if (!userId) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const saltRounds = this.configService.get('BCRYPT_ROUNDS') || 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        await this.userRepository.update(userId, { passwordHash });
        await this.refreshTokenRepository.update({ userId }, { isRevoked: true, revokedAt: new Date() });
        await this.auditService.log({
            userId,
            action: audit_log_entity_1.AuditAction.PASSWORD_RESET,
            description: 'Password reset completed',
            ipAddress,
            userAgent,
        });
        await this.emailService.sendPasswordResetConfirmation(user.email);
    }
    async refreshTokens(refreshToken, ipAddress, userAgent) {
        const tokenRecord = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken },
            relations: ['user'],
        });
        if (!tokenRecord || !tokenRecord.isValid) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.refreshTokenRepository.update(tokenRecord.id, {
            isRevoked: true,
            revokedAt: new Date(),
        });
        const tokens = await this.generateTokens(tokenRecord.userId, ipAddress, userAgent);
        await this.auditService.log({
            userId: tokenRecord.userId,
            action: audit_log_entity_1.AuditAction.TOKEN_REFRESH,
            description: 'Tokens refreshed',
            ipAddress,
            userAgent,
        });
        return tokens;
    }
    async generateTokens(userId, ipAddress, userAgent) {
        const payload = { sub: userId };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.refreshTokenRepository.save({
            userId,
            token: refreshToken,
            expiresAt,
            ipAddress,
            userAgent,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
        };
    }
    async handleFailedLogin(user, ipAddress, userAgent) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const maxAttempts = 5;
        let lockedUntil = null;
        if (failedAttempts >= maxAttempts) {
            lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
        }
        await this.userRepository.update(user.id, {
            failedLoginAttempts: failedAttempts,
            lockedUntil,
        });
        await this.auditService.log({
            userId: user.id,
            action: audit_log_entity_1.AuditAction.FAILED_LOGIN,
            description: `Failed login attempt ${failedAttempts}/${maxAttempts}`,
            ipAddress,
            userAgent,
            metadata: {
                failedAttempts,
                isLocked: failedAttempts >= maxAttempts,
            },
        });
        if (failedAttempts >= maxAttempts) {
            await this.auditService.log({
                userId: user.id,
                action: audit_log_entity_1.AuditAction.ACCOUNT_LOCK,
                description: 'Account locked due to multiple failed login attempts',
                ipAddress,
                userAgent,
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_profile_entity_1.UserProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(3, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService,
        sms_service_1.SmsService,
        audit_service_1.AuditService,
        token_service_1.TokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map