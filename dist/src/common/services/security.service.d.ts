import { ConfigService } from '@nestjs/config';
export interface MFASecret {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface SecurityHeaders {
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'Strict-Transport-Security': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
}
export declare class SecurityService {
    private readonly configService;
    private readonly logger;
    private readonly encryptionKey;
    private readonly algorithm;
    private readonly ivLength;
    private readonly saltLength;
    private readonly tagLength;
    private readonly loginAttempts;
    constructor(configService: ConfigService);
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    isPasswordStrong(password: string): boolean;
    generateMFASecret(userEmail: string): MFASecret;
    verifyMFAToken(token: string, secret: string): boolean;
    encrypt(plaintext: string): string;
    decrypt(encryptedData: string): string;
    sanitizeInput(input: any): string;
    recordLoginAttempt(identifier: string, success: boolean): Promise<void>;
    getLoginAttempts(identifier: string): Promise<number>;
    isAccountLocked(identifier: string): Promise<boolean>;
    isValidEmail(email: string): boolean;
    getSecurityHeaders(): SecurityHeaders;
    logSecurityEvent(event: string, metadata: any): Promise<void>;
    logSuspiciousActivity(activity: string, metadata: any): Promise<void>;
    generateHash(data: string): string;
    generateSecureToken(length?: number): string;
    isValidIPAddress(ip: string): boolean;
    isSuspiciousUserAgent(userAgent: string): boolean;
}
