import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

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

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendAdminWelcomeEmail(data: AdminWelcomeEmailData): Promise<void> {
    const { email, fullName, setupUrl } = data;

    const mailOptions = {
      from: `"Care Services Platform" <${this.configService.get('EMAIL_FROM', 'noreply@careservices.com')}>`,
      to: email,
      subject: 'Welcome to Care Services Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Care Services Admin Portal</h1>
          <p>Hello ${fullName},</p>
          <p>Your admin account has been created. Please click the link below to set up your password:</p>
          <div style="margin: 30px 0;">
            <a href="${setupUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Set Up Password
            </a>
          </div>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you did not request this account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Care Services Platform. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send admin welcome email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const { email, fullName, resetUrl } = data;

    const mailOptions = {
      from: `"Care Services Platform" <${this.configService.get('EMAIL_FROM', 'noreply@careservices.com')}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hello ${fullName},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Care Services Platform. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendBookingConfirmation(bookingData: any): Promise<void> {
    // Implementation for booking confirmation emails
  }

  async sendProviderNotification(notificationData: any): Promise<void> {
    // Implementation for provider notifications
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}
