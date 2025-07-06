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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = require("twilio");
const token_service_1 = require("./token.service");
let SmsService = SmsService_1 = class SmsService {
    constructor(configService, tokenService) {
        this.configService = configService;
        this.tokenService = tokenService;
        this.logger = new common_1.Logger(SmsService_1.name);
        const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
        if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
            this.twilioClient = new twilio_1.Twilio(accountSid, authToken);
        }
        else {
            this.logger.warn('Twilio credentials not configured properly. SMS functionality will be disabled.');
        }
    }
    async sendVerificationCode(phone) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send verification code to ${phone}:`, error);
            throw error;
        }
    }
    async verifyCode(phone, code) {
        return this.tokenService.verifyPhoneVerificationCode(phone, code);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        token_service_1.TokenService])
], SmsService);
//# sourceMappingURL=sms.service.js.map