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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const speakeasy = require("speakeasy");
const crypto = require("crypto");
const mfa_secret_entity_1 = require("../../database/entities/mfa-secret.entity");
let TokenService = class TokenService {
    constructor(mfaSecretRepository, jwtService, configService) {
        this.mfaSecretRepository = mfaSecretRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.tokenStore = new Map();
    }
    async generateEmailVerificationToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        this.tokenStore.set(token, {
            userId,
            expiresAt,
            type: 'email_verification',
        });
        return token;
    }
    async verifyEmailVerificationToken(token) {
        const tokenData = this.tokenStore.get(token);
        if (!tokenData || tokenData.type !== 'email_verification' || tokenData.expiresAt < new Date()) {
            this.tokenStore.delete(token);
            return null;
        }
        this.tokenStore.delete(token);
        return tokenData.userId;
    }
    async generatePasswordResetToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        this.tokenStore.set(token, {
            userId,
            expiresAt,
            type: 'password_reset',
        });
        return token;
    }
    async verifyPasswordResetToken(token) {
        const tokenData = this.tokenStore.get(token);
        if (!tokenData || tokenData.type !== 'password_reset' || tokenData.expiresAt < new Date()) {
            this.tokenStore.delete(token);
            return null;
        }
        this.tokenStore.delete(token);
        return tokenData.userId;
    }
    async generatePhoneVerificationCode(phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        this.tokenStore.set(`phone_${phone}`, {
            userId: code,
            expiresAt,
            type: 'phone_verification',
        });
        return code;
    }
    async verifyPhoneVerificationCode(phone, code) {
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
    async generateMfaSecret(userId) {
        const secret = speakeasy.generateSecret({
            name: `Care Services (${userId})`,
            issuer: this.configService.get('MFA_ISSUER') || 'Care Services',
            length: 32,
        });
        const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
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
    async verifyMfaCode(userId, code) {
        const mfaSecret = await this.mfaSecretRepository.findOne({
            where: { userId, isVerified: true },
        });
        if (!mfaSecret) {
            return false;
        }
        if (mfaSecret.backupCodes.includes(code.toUpperCase())) {
            const updatedBackupCodes = mfaSecret.backupCodes.filter((backupCode) => backupCode !== code.toUpperCase());
            await this.mfaSecretRepository.update(mfaSecret.id, {
                backupCodes: updatedBackupCodes,
            });
            return true;
        }
        const isValid = speakeasy.totp.verify({
            secret: mfaSecret.secret,
            encoding: 'base32',
            token: code,
            window: 2,
        });
        return isValid;
    }
    async verifyMfaSetup(userId, code) {
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
    async removeMfaSecret(userId) {
        await this.mfaSecretRepository.delete({ userId });
    }
    async getMfaBackupCodes(userId) {
        const mfaSecret = await this.mfaSecretRepository.findOne({
            where: { userId, isVerified: true },
        });
        return mfaSecret?.backupCodes || [];
    }
    async regenerateBackupCodes(userId) {
        const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
        await this.mfaSecretRepository.update({ userId }, { backupCodes });
        return backupCodes;
    }
    cleanupExpiredTokens() {
        const now = new Date();
        for (const [token, data] of this.tokenStore.entries()) {
            if (data.expiresAt < now) {
                this.tokenStore.delete(token);
            }
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mfa_secret_entity_1.MfaSecret)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], TokenService);
//# sourceMappingURL=token.service.js.map