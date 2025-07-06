import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import * as sanitizeHtml from 'sanitize-html';
import { createHash } from 'crypto';

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

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // For AES, this is always 16
  private readonly saltLength = 32; // Salt length for key derivation
  private readonly tagLength = 16; // Auth tag length for GCM
  private readonly loginAttempts = new Map<
    string,
    { count: number; lastAttempt: Date; lockUntil?: Date | undefined }
  >();

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY') || 'default-key-change-in-production';
    // Ensure key is 32 bytes for AES-256
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  // Password Management
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  isPasswordStrong(password: string): boolean {
    if (!password || password.length < 8) return false;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password);

    return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
  }

  // MFA Management
  generateMFASecret(userEmail: string): MFASecret {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.configService.get<string>('MFA_ISSUER') || 'Care Services',
      length: 32,
    });

    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
      backupCodes,
    };
  }

  verifyMFAToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });
  }

  // Data Encryption
  encrypt(plaintext: string): string {
    if (!plaintext) return '';

    try {
      // Generate a random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get the auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      return '';
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';

    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, auth tag, and encrypted data
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error);
      return '';
    }
  }

  // Input Sanitization
  sanitizeInput(input: any): string {
    if (input === null || input === undefined) return '';

    const stringInput = String(input);
    return sanitizeHtml(stringInput, {
      allowedTags: ['p', 'br', 'strong', 'em', 'u'],
      allowedAttributes: {},
    });
  }

  // Rate Limiting & Account Lockout
  async recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
    const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;
    const lockoutDuration = this.configService.get<number>('LOCKOUT_DURATION') || 15; // minutes

    const now = new Date();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(identifier);
      return;
    }

    // Check if lockout period has expired
    if (attempts.lockUntil && now > attempts.lockUntil) {
      attempts.count = 0;
      attempts.lockUntil = undefined;
    }

    attempts.count++;
    attempts.lastAttempt = now;

    if (attempts.count >= maxAttempts) {
      attempts.lockUntil = new Date(now.getTime() + lockoutDuration * 60 * 1000);
    }

    this.loginAttempts.set(identifier, attempts);
  }

  async getLoginAttempts(identifier: string): Promise<number> {
    const attempts = this.loginAttempts.get(identifier);
    return attempts ? attempts.count : 0;
  }

  async isAccountLocked(identifier: string): Promise<boolean> {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts || !attempts.lockUntil) return false;

    const now = new Date();
    if (now > attempts.lockUntil) {
      // Lockout expired, clean up
      attempts.lockUntil = undefined;
      attempts.count = 0;
      return false;
    }

    return true;
  }

  // Email Validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Security Headers
  getSecurityHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }

  // Security Event Logging
  async logSecurityEvent(event: string, metadata: any): Promise<void> {
    this.logger.warn(`Security Event: ${event}`, {
      event,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  async logSuspiciousActivity(activity: string, metadata: any): Promise<void> {
    this.logger.error(`Suspicious Activity: ${activity}`, {
      activity,
      metadata,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });
  }

  // Hash generation for data integrity
  generateHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  // Secure random token generation
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // IP Address validation
  isValidIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^[0-9a-fA-F:]+$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // User Agent validation
  isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }
}
