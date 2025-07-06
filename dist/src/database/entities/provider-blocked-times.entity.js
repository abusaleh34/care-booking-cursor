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
exports.ProviderBlockedTimes = void 0;
const typeorm_1 = require("typeorm");
const service_provider_entity_1 = require("./service-provider.entity");
let ProviderBlockedTimes = class ProviderBlockedTimes {
};
exports.ProviderBlockedTimes = ProviderBlockedTimes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProviderBlockedTimes.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ProviderBlockedTimes.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    __metadata("design:type", Date)
], ProviderBlockedTimes.prototype, "blocked_date", void 0);
__decorate([
    (0, typeorm_1.Column)('time', { nullable: true }),
    __metadata("design:type", String)
], ProviderBlockedTimes.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)('time', { nullable: true }),
    __metadata("design:type", String)
], ProviderBlockedTimes.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 200,
        nullable: true,
    }),
    __metadata("design:type", String)
], ProviderBlockedTimes.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], ProviderBlockedTimes.prototype, "is_recurring", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProviderBlockedTimes.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_provider_entity_1.ServiceProvider, (provider) => provider.blockedTimes, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", service_provider_entity_1.ServiceProvider)
], ProviderBlockedTimes.prototype, "provider", void 0);
exports.ProviderBlockedTimes = ProviderBlockedTimes = __decorate([
    (0, typeorm_1.Entity)('provider_blocked_times'),
    (0, typeorm_1.Index)(['provider_id', 'blocked_date'])
], ProviderBlockedTimes);
//# sourceMappingURL=provider-blocked-times.entity.js.map