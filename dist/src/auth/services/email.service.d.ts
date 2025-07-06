import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    sendVerificationEmail(email: string, verificationToken: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
    sendPasswordChangeNotification(email: string): Promise<void>;
    sendPasswordResetConfirmation(email: string): Promise<void>;
    private getBaseUrl;
    private getEmailVerificationTemplate;
    private getPasswordResetTemplate;
    private getPasswordChangeTemplate;
    private getPasswordResetConfirmationTemplate;
}
