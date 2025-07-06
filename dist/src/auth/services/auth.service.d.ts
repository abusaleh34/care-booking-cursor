import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { UserProfile } from '../../database/entities/user-profile.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { ChangePasswordDto, ConfirmPasswordResetDto, LoginDto, RegisterDto, RequestPasswordResetDto } from '../dto';
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
export declare class AuthService {
    private readonly userRepository;
    private readonly userProfileRepository;
    private readonly userRoleRepository;
    private readonly refreshTokenRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly emailService;
    private readonly smsService;
    private readonly auditService;
    private readonly tokenService;
    constructor(userRepository: Repository<User>, userProfileRepository: Repository<UserProfile>, userRoleRepository: Repository<UserRole>, refreshTokenRepository: Repository<RefreshToken>, jwtService: JwtService, configService: ConfigService, emailService: EmailService, smsService: SmsService, auditService: AuditService, tokenService: TokenService);
    register(registerDto: RegisterDto, ipAddress: string, userAgent: string): Promise<AuthResponse>;
    login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthResponse>;
    logout(userId: string, refreshToken: string, ipAddress: string, userAgent: string): Promise<void>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto, ipAddress: string, userAgent: string): Promise<void>;
    requestPasswordReset(dto: RequestPasswordResetDto, ipAddress: string, userAgent: string): Promise<void>;
    confirmPasswordReset(dto: ConfirmPasswordResetDto, ipAddress: string, userAgent: string): Promise<void>;
    refreshTokens(refreshToken: string, ipAddress: string, userAgent: string): Promise<AuthTokens>;
    private generateTokens;
    private handleFailedLogin;
}
