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
exports.ProviderAvailability = void 0;
const typeorm_1 = require("typeorm");
const service_provider_entity_1 = require("./service-provider.entity");
let ProviderAvailability = class ProviderAvailability {
};
exports.ProviderAvailability = ProviderAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProviderAvailability.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], ProviderAvailability.prototype, "provider_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        comment: '0=Sunday, 1=Monday, ..., 6=Saturday',
    }),
    __metadata("design:type", Number)
], ProviderAvailability.prototype, "day_of_week", void 0);
__decorate([
    (0, typeorm_1.Column)('time'),
    __metadata("design:type", String)
], ProviderAvailability.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)('time'),
    __metadata("design:type", String)
], ProviderAvailability.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
    }),
    __metadata("design:type", Boolean)
], ProviderAvailability.prototype, "is_available", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProviderAvailability.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_provider_entity_1.ServiceProvider, (provider) => provider.availability, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", service_provider_entity_1.ServiceProvider)
], ProviderAvailability.prototype, "provider", void 0);
exports.ProviderAvailability = ProviderAvailability = __decorate([
    (0, typeorm_1.Entity)('provider_availability'),
    (0, typeorm_1.Index)(['provider_id', 'day_of_week'])
], ProviderAvailability);
//# sourceMappingURL=provider-availability.entity.js.map