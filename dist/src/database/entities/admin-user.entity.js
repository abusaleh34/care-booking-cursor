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
exports.AdminUser = exports.AdminLevel = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const provider_verification_entity_1 = require("./provider-verification.entity");
const dispute_entity_1 = require("./dispute.entity");
const platform_setting_entity_1 = require("./platform-setting.entity");
var AdminLevel;
(function (AdminLevel) {
    AdminLevel["SUPER_ADMIN"] = "super_admin";
    AdminLevel["MODERATOR"] = "moderator";
    AdminLevel["SUPPORT"] = "support";
    AdminLevel["FINANCIAL"] = "financial";
})(AdminLevel || (exports.AdminLevel = AdminLevel = {}));
let AdminUser = class AdminUser {
};
exports.AdminUser = AdminUser;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdminUser.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], AdminUser.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], AdminUser.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdminLevel,
        name: 'admin_level',
    }),
    __metadata("design:type", String)
], AdminUser.prototype, "adminLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: {},
    }),
    __metadata("design:type", Object)
], AdminUser.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        name: 'is_active',
    }),
    __metadata("design:type", Boolean)
], AdminUser.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp',
        name: 'created_at',
    }),
    __metadata("design:type", Date)
], AdminUser.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => provider_verification_entity_1.ProviderVerification, (verification) => verification.admin),
    __metadata("design:type", Array)
], AdminUser.prototype, "verifications", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dispute_entity_1.Dispute, (dispute) => dispute.assignedAdmin),
    __metadata("design:type", Array)
], AdminUser.prototype, "assignedDisputes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => platform_setting_entity_1.PlatformSetting, (setting) => setting.updatedBy),
    __metadata("design:type", Array)
], AdminUser.prototype, "updatedSettings", void 0);
exports.AdminUser = AdminUser = __decorate([
    (0, typeorm_1.Entity)('admin_users')
], AdminUser);
//# sourceMappingURL=admin-user.entity.js.map