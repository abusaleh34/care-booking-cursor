import { ConfigService } from '@nestjs/config';
export declare class PasswordService {
    private readonly configService;
    constructor(configService: ConfigService);
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    generateTemporaryPassword(): string;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    createSecureHash(data: string): Promise<string>;
    verifySecureHash(data: string, hash: string): Promise<boolean>;
}
