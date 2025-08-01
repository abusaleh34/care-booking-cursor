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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmPhoneVerificationDto = exports.RequestPhoneVerificationDto = void 0;
const class_validator_1 = require("class-validator");
class RequestPhoneVerificationDto {
}
exports.RequestPhoneVerificationDto = RequestPhoneVerificationDto;
__decorate([
    (0, class_validator_1.IsPhoneNumber)(null, { message: 'Please provide a valid phone number' }),
    __metadata("design:type", String)
], RequestPhoneVerificationDto.prototype, "phone", void 0);
class ConfirmPhoneVerificationDto {
}
exports.ConfirmPhoneVerificationDto = ConfirmPhoneVerificationDto;
__decorate([
    (0, class_validator_1.IsPhoneNumber)(null, { message: 'Please provide a valid phone number' }),
    __metadata("design:type", String)
], ConfirmPhoneVerificationDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'Verification code must be at least 4 characters' }),
    (0, class_validator_1.MaxLength)(10, { message: 'Verification code must not exceed 10 characters' }),
    __metadata("design:type", String)
], ConfirmPhoneVerificationDto.prototype, "code", void 0);
//# sourceMappingURL=verify-phone.dto.js.map