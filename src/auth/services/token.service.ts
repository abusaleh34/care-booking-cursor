import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

import { MfaSecret } from '../../database/entities/mfa-secret.entity';

@Injectable()
export class TokenService {
  private readonly tokenStore = new Map<
    string,
    { userId: string; expiresAt: Date; type: string }
  >();

  constructor(
    @InjectRepository(MfaSecret)
    private readonly mfaSecretRepository: Repository<MfaSecret>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    this.tokenStore.set(token, {
      userId,
      expiresAt,
      type: 'email_verification',
    });

    return token;
  }

  async verifyEmailVerificationToken(token: string): Promise<string | null> {
    const tokenData = this.tokenStore.get(token);

    if (!tokenData || tokenData.type !== 'email_verification' || tokenData.expiresAt < new Date()) {
      this.tokenStore.delete(token);
      return null;
    }

    this.tokenStore.delete(token);
    return tokenData.userId;
  }

  async generatePasswordResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    this.tokenStore.set(token, {
      userId,
      expiresAt,
      type: 'password_reset',
    });

    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const tokenData = this.tokenStore.get(token);

    if (!tokenData || tokenData.type !== 'password_reset' || tokenData.expiresAt < new Date()) {
      this.tokenStore.delete(token);
      return null;
    }

    this.tokenStore.delete(token);
    return tokenData.userId;
  }

  async generatePhoneVerificationCode(phone: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    this.tokenStore.set(`phone_${phone}`, {
      userId: code,
      expiresAt,
      type: 'phone_verification',
    });

    return code;
  }

  async verifyPhoneVerificationCode(phone: string, code: string): Promise<boolean> {
    const tokenData = this.tokenStore.get(`phone_${phone}`);

    if (!tokenData || tokenData.type !== 'phone_verification' || tokenData.expiresAt < new Date()) {
      this.tokenStore.delete(`phone_${phone}`);
      return false;
    }

    const isValid = tokenData.userId === code;
    if (isValid) {
      this.tokenStore.delete(`phone_${phone}`);
    }

    return isValid;
  }

  async generateMfaSecret(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `Care Services (${userId})`,
      issuer: this.configService.get('MFA_ISSUER') || 'Care Services',
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    // Save to database
    await this.mfaSecretRepository.save({
      userId,
      secret: secret.base32,
      backupCodes,
      isVerified: false,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      backupCodes,
    };
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, isVerified: true },
    });

    if (!mfaSecret) {
      return false;
    }

    // Check if it's a backup code
    if (mfaSecret.backupCodes.includes(code.toUpperCase())) {
      // Remove used backup code
      const updatedBackupCodes = mfaSecret.backupCodes.filter(
        (backupCode) => backupCode !== code.toUpperCase(),
      );

      await this.mfaSecretRepository.update(mfaSecret.id, {
        backupCodes: updatedBackupCodes,
      });

      return true;
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before and after
    });

    return isValid;
  }

  async verifyMfaSetup(userId: string, code: string): Promise<boolean> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, isVerified: false },
    });

    if (!mfaSecret) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (isValid) {
      await this.mfaSecretRepository.update(mfaSecret.id, {
        isVerified: true,
      });
    }

    return isValid;
  }

  async removeMfaSecret(userId: string): Promise<void> {
    await this.mfaSecretRepository.delete({ userId });
  }

  async getMfaBackupCodes(userId: string): Promise<string[]> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, isVerified: true },
    });

    return mfaSecret?.backupCodes || [];
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    await this.mfaSecretRepository.update({ userId }, { backupCodes });

    return backupCodes;
  }

  // Clean up expired tokens periodically
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.tokenStore.entries()) {
      if (data.expiresAt < now) {
        this.tokenStore.delete(token);
      }
    }
  }
}
