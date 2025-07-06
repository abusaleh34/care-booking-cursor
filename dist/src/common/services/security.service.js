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
var SecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");
const crypto_1 = require("crypto");
let SecurityService = SecurityService_1 = class SecurityService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SecurityService_1.name);
        this.algorithm = 'aes-256-gcm';
        this.ivLength = 16;
        this.saltLength = 32;
        this.tagLength = 16;
        this.loginAttempts = new Map();
        const key = this.configService.get('ENCRYPTION_KEY') || 'default-key-change-in-production';
        this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
    }
    async hashPassword(password) {
        const saltRounds = this.configService.get('BCRYPT_ROUNDS') || 12;
        return bcrypt.hash(password, saltRounds);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    isPasswordStrong(password) {
        if (!password || password.length < 8)
            return false;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password);
        return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
    }
    generateMFASecret(userEmail) {
        const secret = speakeasy.generateSecret({
            name: userEmail,
            issuer: this.configService.get('MFA_ISSUER') || 'Care Services',
            length: 32,
        });
        const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
        return {
            secret: secret.base32,
            qrCodeUrl: secret.otpauth_url || '',
            backupCodes,
        };
    }
    verifyMFAToken(token, secret) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });
    }
    encrypt(plaintext) {
        if (!plaintext)
            return '';
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            let encrypted = cipher.update(plaintext, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const authTag = cipher.getAuthTag();
            const combined = Buffer.concat([iv, authTag, encrypted]);
            return combined.toString('base64');
        }
        catch (error) {
            this.logger.error('Encryption failed', error);
            return '';
        }
    }
    decrypt(encryptedData) {
        if (!encryptedData)
            return '';
        try {
            const combined = Buffer.from(encryptedData, 'base64');
            const iv = combined.slice(0, this.ivLength);
            const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
            const encrypted = combined.slice(this.ivLength + this.tagLength);
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            this.logger.error('Decryption failed', error);
            return '';
        }
    }
    sanitizeInput(input) {
        if (input === null || input === undefined)
            return '';
        const stringInput = String(input);
        return sanitizeHtml(stringInput, {
            allowedTags: ['p', 'br', 'strong', 'em', 'u'],
            allowedAttributes: {},
        });
    }
    async recordLoginAttempt(identifier, success) {
        const maxAttempts = this.configService.get('MAX_LOGIN_ATTEMPTS') || 5;
        const lockoutDuration = this.configService.get('LOCKOUT_DURATION') || 15;
        const now = new Date();
        const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
        if (success) {
            this.loginAttempts.delete(identifier);
            return;
        }
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
    async getLoginAttempts(identifier) {
        const attempts = this.loginAttempts.get(identifier);
        return attempts ? attempts.count : 0;
    }
    async isAccountLocked(identifier) {
        const attempts = this.loginAttempts.get(identifier);
        if (!attempts || !attempts.lockUntil)
            return false;
        const now = new Date();
        if (now > attempts.lockUntil) {
            attempts.lockUntil = undefined;
            attempts.count = 0;
            return false;
        }
        return true;
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        };
    }
    async logSecurityEvent(event, metadata) {
        this.logger.warn(`Security Event: ${event}`, {
            event,
            metadata,
            timestamp: new Date().toISOString(),
        });
    }
    async logSuspiciousActivity(activity, metadata) {
        this.logger.error(`Suspicious Activity: ${activity}`, {
            activity,
            metadata,
            timestamp: new Date().toISOString(),
            severity: 'HIGH',
        });
    }
    generateHash(data) {
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    isValidIPAddress(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^[0-9a-fA-F:]+$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
    }
    isSuspiciousUserAgent(userAgent) {
        const suspiciousPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i];
        return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = SecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map