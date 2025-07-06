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
exports.Service = void 0;
const typeorm_1 = require("typeorm");
const service_provider_entity_1 = require("./service-provider.entity");
const service_category_entity_1 = require("./service-category.entity");
const booking_entity_1 = require("./booking.entity");
let Service = class Service {
    get durationHours() {
        const hours = Math.floor(this.durationMinutes / 60);
        const minutes = this.durationMinutes % 60;
        if (hours === 0)
            return `${minutes}min`;
        if (minutes === 0)
            return `${hours}h`;
        return `${hours}h ${minutes}min`;
    }
    get formattedPrice() {
        return `$${this.price.toFixed(2)}`;
    }
    get totalBookings() {
        return this.bookings?.length || 0;
    }
    get completedBookings() {
        return this.bookings?.filter((booking) => booking.status === 'completed').length || 0;
    }
};
exports.Service = Service;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Service.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'provider_id' }),
    __metadata("design:type", String)
], Service.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'category_id', nullable: true }),
    __metadata("design:type", String)
], Service.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Service.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Service.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'duration_minutes' }),
    __metadata("design:type", Number)
], Service.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Service.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_home_service' }),
    __metadata("design:type", Boolean)
], Service.prototype, "isHomeService", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], Service.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Service.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_provider_entity_1.ServiceProvider, (provider) => provider.services, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", service_provider_entity_1.ServiceProvider)
], Service.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_category_entity_1.ServiceCategory, (category) => category.services),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", service_category_entity_1.ServiceCategory)
], Service.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => booking_entity_1.Booking, (booking) => booking.service),
    __metadata("design:type", Array)
], Service.prototype, "bookings", void 0);
exports.Service = Service = __decorate([
    (0, typeorm_1.Entity)('services'),
    (0, typeorm_1.Index)(['isActive']),
    (0, typeorm_1.Index)(['price']),
    (0, typeorm_1.Index)(['durationMinutes'])
], Service);
//# sourceMappingURL=service.entity.js.map