import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { RoleType, UserRole } from '../../database/entities/user-role.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { AuditAction, AuditLog } from '../../database/entities/audit-log.entity';

import {
  ChangePasswordDto,
  ConfirmPasswordResetDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
} from '../dto';

import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { AuditService } from './audit.service';
import { TokenService } from './token.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    isVerified: boolean;
    mfaEnabled: boolean;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly auditService: AuditService,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponse> {
    const { email, phone, password, firstName, lastName, ...profileData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, ...(phone ? [{ phone }] : [])],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.phone === phone) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    // Hash password
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS')) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      phone,
      passwordHash,
      isVerified: false,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Create user profile
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

    // Assign default customer role
    const userRole = this.userRoleRepository.create({
      userId: savedUser.id,
      roleType: RoleType.CUSTOMER,
      isActive: true,
    });

    await this.userRoleRepository.save(userRole);

    // Send verification email
    const verificationToken = await this.tokenService.generateEmailVerificationToken(savedUser.id);
    await this.emailService.sendVerificationEmail(savedUser.email, verificationToken);

    // Log registration
    await this.auditService.log({
      userId: savedUser.id,
      action: AuditAction.REGISTER,
      description: 'User registered successfully',
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const tokens = await this.generateTokens(savedUser.id, ipAddress, userAgent);

    // Return user data
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
        roles: [RoleType.CUSTOMER],
      },
    };
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    const { email, phone, password, mfaCode } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: email ? { email } : { phone },
      relations: ['profile', 'roles', 'mfaSecret'],
    });

    if (!user) {
      await this.auditService.log({
        action: AuditAction.FAILED_LOGIN,
        description: `Failed login attempt for ${email || phone}`,
        ipAddress,
        userAgent,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      await this.auditService.log({
        userId: user.id,
        action: AuditAction.FAILED_LOGIN,
        description: 'Login attempt on locked account',
        ipAddress,
        userAgent,
        metadata: { reason: 'account_locked' },
      });
      throw new ForbiddenException('Account is temporarily locked. Please try again later.');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new BadRequestException('MFA code is required');
      }

      const isMfaValid = await this.tokenService.verifyMfaCode(user.id, mfaCode);
      if (!isMfaValid) {
        await this.auditService.log({
          userId: user.id,
          action: AuditAction.FAILED_LOGIN,
          description: 'Invalid MFA code provided',
          ipAddress,
          userAgent,
          metadata: { reason: 'invalid_mfa' },
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed login attempts
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    // Log successful login
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      description: 'User logged in successfully',
      ipAddress,
      userAgent,
    });

    // Generate tokens
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

  async logout(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    // Revoke refresh token
    await this.refreshTokenRepository.update(
      { userId, token: refreshToken },
      { isRevoked: true, revokedAt: new Date() },
    );

    // Log logout
    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      description: 'User logged out',
      ipAddress,
      userAgent,
    });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true, revokedAt: new Date() },
    );

    // Log password change
    await this.auditService.log({
      userId,
      action: AuditAction.PASSWORD_CHANGE,
      description: 'Password changed successfully',
      ipAddress,
      userAgent,
    });

    // Send notification email
    await this.emailService.sendPasswordChangeNotification(user.email);
  }

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const { email } = dto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token
    const resetToken = await this.tokenService.generatePasswordResetToken(user.id);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    // Log password reset request
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET,
      description: 'Password reset requested',
      ipAddress,
      userAgent,
    });
  }

  async confirmPasswordReset(
    dto: ConfirmPasswordResetDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Verify reset token
    const userId = await this.tokenService.verifyPasswordResetToken(token);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, { passwordHash });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true, revokedAt: new Date() },
    );

    // Log password reset
    await this.auditService.log({
      userId,
      action: AuditAction.PASSWORD_RESET,
      description: 'Password reset completed',
      ipAddress,
      userAgent,
    });

    // Send confirmation email
    await this.emailService.sendPasswordResetConfirmation(user.email);
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord || !tokenRecord.isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.refreshTokenRepository.update(tokenRecord.id, {
      isRevoked: true,
      revokedAt: new Date(),
    });

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.userId, ipAddress, userAgent);

    // Log token refresh
    await this.auditService.log({
      userId: tokenRecord.userId,
      action: AuditAction.TOKEN_REFRESH,
      description: 'Tokens refreshed',
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  private async generateTokens(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

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
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private async handleFailedLogin(user: User, ipAddress: string, userAgent: string): Promise<void> {
    const failedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = 5;

    let lockedUntil: Date | null = null;

    if (failedAttempts >= maxAttempts) {
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30); // Lock for 30 minutes
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: failedAttempts,
      lockedUntil,
    });

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.FAILED_LOGIN,
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
        action: AuditAction.ACCOUNT_LOCK,
        description: 'Account locked due to multiple failed login attempts',
        ipAddress,
        userAgent,
      });
    }
  }
}
