import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { TokenService } from './token.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: Twilio;

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    // Only initialize Twilio if we have valid credentials (not placeholder values)
    if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio credentials not configured properly. SMS functionality will be disabled.',
      );
    }
  }

  async sendVerificationCode(phone: string): Promise<void> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio not configured, skipping SMS send');
        return;
      }

      const code = await this.tokenService.generatePhoneVerificationCode(phone);
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

      await this.twilioClient.messages.create({
        body: `Your Care Services verification code is: ${code}. This code will expire in 10 minutes.`,
        from: fromNumber,
        to: phone,
      });

      this.logger.log(`Verification code sent to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${phone}:`, error);
      throw error;
    }
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    return this.tokenService.verifyPhoneVerificationCode(phone, code);
  }
}
