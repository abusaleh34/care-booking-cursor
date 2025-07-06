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
exports.ServiceProvider = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const service_entity_1 = require("./service.entity");
const booking_entity_1 = require("./booking.entity");
let ServiceProvider = class ServiceProvider {
    get location() {
        return this.latitude && this.longitude ? { lat: this.latitude, lng: this.longitude } : null;
    }
    get activeServicesCount() {
        return this.services?.filter((service) => service.isActive).length || 0;
    }
    get completedBookingsCount() {
        return this.bookings?.filter((booking) => booking.status === 'completed').length || 0;
    }
};
exports.ServiceProvider = ServiceProvider;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ServiceProvider.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, name: 'business_name' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "businessName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'business_description' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "businessDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'business_address' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "businessAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], ServiceProvider.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], ServiceProvider.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, name: 'business_phone' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "businessPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'business_email' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "businessEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, name: 'license_number' }),
    __metadata("design:type", String)
], ServiceProvider.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_verified' }),
    __metadata("design:type", Boolean)
], ServiceProvider.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], ServiceProvider.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' }),
    __metadata("design:type", Number)
], ServiceProvider.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'total_reviews' }),
    __metadata("design:type", Number)
], ServiceProvider.prototype, "totalReviews", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ServiceProvider.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ServiceProvider.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ServiceProvider.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_entity_1.Service, (service) => service.provider),
    __metadata("design:type", Array)
], ServiceProvider.prototype, "services", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => booking_entity_1.Booking, (booking) => booking.provider),
    __metadata("design:type", Array)
], ServiceProvider.prototype, "bookings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ProviderAvailability', 'provider'),
    __metadata("design:type", Array)
], ServiceProvider.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('ProviderBlockedTimes', 'provider'),
    __metadata("design:type", Array)
], ServiceProvider.prototype, "blockedTimes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Review', 'provider'),
    __metadata("design:type", Array)
], ServiceProvider.prototype, "reviews", void 0);
exports.ServiceProvider = ServiceProvider = __decorate([
    (0, typeorm_1.Entity)('service_providers'),
    (0, typeorm_1.Index)(['isActive']),
    (0, typeorm_1.Index)(['isVerified']),
    (0, typeorm_1.Index)(['averageRating']),
    (0, typeorm_1.Index)(['latitude', 'longitude'])
], ServiceProvider);
//# sourceMappingURL=service-provider.entity.js.map