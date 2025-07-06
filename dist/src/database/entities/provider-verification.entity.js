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
exports.ProviderVerification = exports.VerificationStatus = void 0;
const typeorm_1 = require("typeorm");
const service_provider_entity_1 = require("./service-provider.entity");
const admin_user_entity_1 = require("./admin-user.entity");
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["APPROVED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
    VerificationStatus["REQUIRES_INFO"] = "requires_info";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
let ProviderVerification = class ProviderVerification {
};
exports.ProviderVerification = ProviderVerification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProviderVerification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'provider_id' }),
    __metadata("design:type", String)
], ProviderVerification.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_provider_entity_1.ServiceProvider),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", service_provider_entity_1.ServiceProvider)
], ProviderVerification.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'admin_id' }),
    __metadata("design:type", String)
], ProviderVerification.prototype, "adminId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_user_entity_1.AdminUser, (admin) => admin.verifications),
    (0, typeorm_1.JoinColumn)({ name: 'admin_id' }),
    __metadata("design:type", admin_user_entity_1.AdminUser)
], ProviderVerification.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        name: 'verification_type',
    }),
    __metadata("design:type", String)
], ProviderVerification.prototype, "verificationType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProviderVerification.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: [],
    }),
    __metadata("design:type", Array)
], ProviderVerification.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], ProviderVerification.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        name: 'reviewed_at',
    }),
    __metadata("design:type", Date)
], ProviderVerification.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp',
        name: 'created_at',
    }),
    __metadata("design:type", Date)
], ProviderVerification.prototype, "createdAt", void 0);
exports.ProviderVerification = ProviderVerification = __decorate([
    (0, typeorm_1.Entity)('provider_verifications')
], ProviderVerification);
//# sourceMappingURL=provider-verification.entity.js.map