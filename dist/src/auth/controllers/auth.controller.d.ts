import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';
import { ChangePasswordDto, ConfirmEmailVerificationDto, ConfirmPasswordResetDto, ConfirmPhoneVerificationDto, DisableMfaDto, EnableMfaDto, LoginDto, RefreshTokenDto, RegisterDto, RequestEmailVerificationDto, RequestPasswordResetDto, RequestPhoneVerificationDto, VerifyMfaSetupDto } from '../dto';
import { AuthenticatedUser } from '../interfaces/auth.interface';
export declare class AuthController {
    private readonly authService;
    private readonly tokenService;
    private readonly emailService;
    private readonly smsService;
    constructor(authService: AuthService, tokenService: TokenService, emailService: EmailService, smsService: SmsService);
    register(registerDto: RegisterDto, req: Request): Promise<import("../services/auth.service").AuthResponse>;
    login(loginDto: LoginDto, req: Request): Promise<import("../services/auth.service").AuthResponse>;
    logout(body: {
        refreshToken: string;
    }, user: AuthenticatedUser, req: Request): Promise<{
        message: string;
    }>;
    refreshTokens(refreshTokenDto: RefreshTokenDto, req: Request): Promise<import("../services/auth.service").AuthTokens>;
    changePassword(changePasswordDto: ChangePasswordDto, user: AuthenticatedUser, req: Request): Promise<{
        message: string;
    }>;
    requestPasswordReset(dto: RequestPasswordResetDto, req: Request): Promise<{
        message: string;
    }>;
    confirmPasswordReset(dto: ConfirmPasswordResetDto, req: Request): Promise<{
        message: string;
    }>;
    requestEmailVerification(dto: RequestEmailVerificationDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: ConfirmEmailVerificationDto): Promise<{
        message: string;
    }>;
    requestPhoneVerification(dto: RequestPhoneVerificationDto): Promise<{
        message: string;
    }>;
    verifyPhone(dto: ConfirmPhoneVerificationDto): Promise<{
        message: string;
    }>;
    enableMfa(dto: EnableMfaDto, user: any): Promise<{
        message: string;
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }>;
    verifyMfaSetup(dto: VerifyMfaSetupDto, user: any): Promise<{
        message: string;
    }>;
    disableMfa(dto: DisableMfaDto, user: any): Promise<{
        message: string;
    }>;
    getBackupCodes(user: any): Promise<{
        backupCodes: string[];
    }>;
    regenerateBackupCodes(user: any): Promise<{
        backupCodes: string[];
    }>;
    getProfile(user: any): Promise<{
        user: any;
    }>;
}
