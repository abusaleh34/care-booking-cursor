import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MfaSecret } from '../../database/entities/mfa-secret.entity';
export declare class TokenService {
    private readonly mfaSecretRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly tokenStore;
    constructor(mfaSecretRepository: Repository<MfaSecret>, jwtService: JwtService, configService: ConfigService);
    generateEmailVerificationToken(userId: string): Promise<string>;
    verifyEmailVerificationToken(token: string): Promise<string | null>;
    generatePasswordResetToken(userId: string): Promise<string>;
    verifyPasswordResetToken(token: string): Promise<string | null>;
    generatePhoneVerificationCode(phone: string): Promise<string>;
    verifyPhoneVerificationCode(phone: string, code: string): Promise<boolean>;
    generateMfaSecret(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }>;
    verifyMfaCode(userId: string, code: string): Promise<boolean>;
    verifyMfaSetup(userId: string, code: string): Promise<boolean>;
    removeMfaSecret(userId: string): Promise<void>;
    getMfaBackupCodes(userId: string): Promise<string[]>;
    regenerateBackupCodes(userId: string): Promise<string[]>;
    cleanupExpiredTokens(): void;
}
