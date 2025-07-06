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
exports.PlatformSetting = void 0;
const typeorm_1 = require("typeorm");
const admin_user_entity_1 = require("./admin-user.entity");
let PlatformSetting = class PlatformSetting {
};
exports.PlatformSetting = PlatformSetting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlatformSetting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        unique: true,
        name: 'setting_key',
    }),
    __metadata("design:type", String)
], PlatformSetting.prototype, "settingKey", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        name: 'setting_value',
    }),
    __metadata("design:type", Object)
], PlatformSetting.prototype, "settingValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", String)
], PlatformSetting.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', {
        nullable: true,
        name: 'updated_by',
    }),
    __metadata("design:type", String)
], PlatformSetting.prototype, "updatedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_user_entity_1.AdminUser, (admin) => admin.updatedSettings),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", admin_user_entity_1.AdminUser)
], PlatformSetting.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp',
        name: 'updated_at',
    }),
    __metadata("design:type", Date)
], PlatformSetting.prototype, "updatedAt", void 0);
exports.PlatformSetting = PlatformSetting = __decorate([
    (0, typeorm_1.Entity)('platform_settings')
], PlatformSetting);
//# sourceMappingURL=platform-setting.entity.js.map