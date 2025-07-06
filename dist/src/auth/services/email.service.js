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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (smtpHost && smtpUser && smtpPass && !smtpUser.includes('your-email')) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: this.configService.get('SMTP_PORT'),
                secure: false,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
        }
        else {
            this.logger.warn('SMTP credentials not configured properly. Email functionality will be disabled.');
        }
    }
    async sendVerificationEmail(email, verificationToken) {
        if (!this.transporter) {
            this.logger.warn(`Email sending skipped - SMTP not configured. Would send verification email to ${email}`);
            return;
        }
        try {
            const verificationUrl = `${this.getBaseUrl()}/auth/verify-email?token=${verificationToken}`;
            const mailOptions = {
                from: this.configService.get('SMTP_USER'),
                to: email,
                subject: 'Verify Your Email - Care Services',
                html: this.getEmailVerificationTemplate(verificationUrl),
            };
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Verification email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email to ${email}:`, error);
            throw error;
        }
    }
    async sendPasswordResetEmail(email, resetToken) {
        if (!this.transporter) {
            this.logger.warn(`Email sending skipped - SMTP not configured. Would send password reset email to ${email}`);
            return;
        }
        try {
            const resetUrl = `${this.getBaseUrl()}/auth/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: this.configService.get('SMTP_USER'),
                to: email,
                subject: 'Reset Your Password - Care Services',
                html: this.getPasswordResetTemplate(resetUrl),
            };
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}:`, error);
            throw error;
        }
    }
    async sendPasswordChangeNotification(email) {
        try {
            const mailOptions = {
                from: this.configService.get('SMTP_USER'),
                to: email,
                subject: 'Password Changed - Care Services',
                html: this.getPasswordChangeTemplate(),
            };
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password change notification sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password change notification to ${email}:`, error);
            throw error;
        }
    }
    async sendPasswordResetConfirmation(email) {
        try {
            const mailOptions = {
                from: this.configService.get('SMTP_USER'),
                to: email,
                subject: 'Password Reset Successful - Care Services',
                html: this.getPasswordResetConfirmationTemplate(),
            };
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Password reset confirmation sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset confirmation to ${email}:`, error);
            throw error;
        }
    }
    getBaseUrl() {
        const nodeEnv = this.configService.get('NODE_ENV');
        return nodeEnv === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3001';
    }
    getEmailVerificationTemplate(verificationUrl) {
        return `<h1>Verify Your Email</h1><p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`;
    }
    getPasswordResetTemplate(resetUrl) {
        return `<h1>Reset Password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
    }
    getPasswordChangeTemplate() {
        return `<h1>Password Changed</h1><p>Your password has been successfully changed.</p>`;
    }
    getPasswordResetConfirmationTemplate() {
        return `<h1>Password Reset Successful</h1><p>Your password has been successfully reset.</p>`;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map