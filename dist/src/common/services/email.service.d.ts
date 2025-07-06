import { ConfigService } from '@nestjs/config';
export interface AdminWelcomeEmailData {
    email: string;
    fullName: string;
    resetToken: string;
    setupUrl: string;
}
export interface PasswordResetEmailData {
    email: string;
    fullName: string;
    resetToken: string;
    resetUrl: string;
}
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendAdminWelcomeEmail(data: AdminWelcomeEmailData): Promise<void>;
    sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void>;
    sendBookingConfirmation(bookingData: any): Promise<void>;
    sendProviderNotification(notificationData: any): Promise<void>;
    verifyConnection(): Promise<boolean>;
}
