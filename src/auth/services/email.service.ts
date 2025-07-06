import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    // Only create transporter if we have proper SMTP configuration
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
    } else {
      this.logger.warn(
        'SMTP credentials not configured properly. Email functionality will be disabled.',
      );
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Email sending skipped - SMTP not configured. Would send verification email to ${email}`,
      );
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
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Email sending skipped - SMTP not configured. Would send password reset email to ${email}`,
      );
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
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordChangeNotification(email: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_USER'),
        to: email,
        subject: 'Password Changed - Care Services',
        html: this.getPasswordChangeTemplate(),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password change notification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password change notification to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_USER'),
        to: email,
        subject: 'Password Reset Successful - Care Services',
        html: this.getPasswordResetConfirmationTemplate(),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset confirmation sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset confirmation to ${email}:`, error);
      throw error;
    }
  }

  private getBaseUrl(): string {
    const nodeEnv = this.configService.get('NODE_ENV');
    return nodeEnv === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3001';
  }

  private getEmailVerificationTemplate(verificationUrl: string): string {
    return `<h1>Verify Your Email</h1><p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `<h1>Reset Password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
  }

  private getPasswordChangeTemplate(): string {
    return `<h1>Password Changed</h1><p>Your password has been successfully changed.</p>`;
  }

  private getPasswordResetConfirmationTemplate(): string {
    return `<h1>Password Reset Successful</h1><p>Your password has been successfully reset.</p>`;
  }
}
