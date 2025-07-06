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
exports.Booking = exports.PaymentStatus = exports.BookingStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const service_provider_entity_1 = require("./service-provider.entity");
const service_entity_1 = require("./service.entity");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["IN_PROGRESS"] = "in_progress";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["REFUNDED"] = "refunded";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let Booking = class Booking {
    get bookingDate() {
        return this.scheduledDate;
    }
    set bookingDate(value) {
        this.scheduledDate = value;
    }
    get startTime() {
        return this.scheduledTime;
    }
    set startTime(value) {
        this.scheduledTime = value;
    }
    get endTime() {
        if (!this.scheduledTime || !this.duration)
            return '';
        const [hours, minutes] = this.scheduledTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + this.duration;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
    get totalAmount() {
        return this.totalPrice;
    }
    set totalAmount(value) {
        this.totalPrice = value;
    }
    get notes() {
        return this.customerNotes || '';
    }
    set notes(value) {
        this.customerNotes = value;
    }
    get bookingDateTime() {
        const [hours, minutes] = this.scheduledTime.split(':').map(Number);
        const dateTime = new Date(this.scheduledDate);
        dateTime.setHours(hours, minutes, 0, 0);
        return dateTime;
    }
    get formattedAmount() {
        return `$${this.totalPrice.toFixed(2)}`;
    }
};
exports.Booking = Booking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Booking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'customer_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Booking.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'provider_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Booking.prototype, "providerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_provider_entity_1.ServiceProvider),
    (0, typeorm_1.JoinColumn)({ name: 'provider_id' }),
    __metadata("design:type", service_provider_entity_1.ServiceProvider)
], Booking.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'service_id' }),
    __metadata("design:type", String)
], Booking.prototype, "serviceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_entity_1.Service),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_entity_1.Service)
], Booking.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.PENDING,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'scheduled_date' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Booking.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'scheduled_time' }),
    __metadata("design:type", String)
], Booking.prototype, "scheduledTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Booking.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' }),
    __metadata("design:type", Number)
], Booking.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, name: 'platform_fee' }),
    __metadata("design:type", Number)
], Booking.prototype, "platformFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, name: 'provider_earnings' }),
    __metadata("design:type", Number)
], Booking.prototype, "providerEarnings", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
        name: 'payment_status',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Booking.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'payment_intent_id' }),
    __metadata("design:type", String)
], Booking.prototype, "paymentIntentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'customer_notes' }),
    __metadata("design:type", String)
], Booking.prototype, "customerNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'provider_notes' }),
    __metadata("design:type", String)
], Booking.prototype, "providerNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'cancellation_reason' }),
    __metadata("design:type", String)
], Booking.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'cancelled_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'completed_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Booking.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'created_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp', name: 'updated_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Check)(`"scheduled_date" >= CURRENT_DATE`),
    __metadata("design:type", Object)
], Booking.prototype, "scheduledDateCheck", void 0);
__decorate([
    (0, typeorm_1.Check)(`"total_price" >= 0`),
    __metadata("design:type", Object)
], Booking.prototype, "totalPriceCheck", void 0);
__decorate([
    (0, typeorm_1.Check)(`"duration" > 0`),
    __metadata("design:type", Object)
], Booking.prototype, "durationCheck", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('Review', 'booking'),
    __metadata("design:type", Array)
], Booking.prototype, "reviews", void 0);
exports.Booking = Booking = __decorate([
    (0, typeorm_1.Entity)('bookings'),
    (0, typeorm_1.Index)(['status', 'scheduledDate']),
    (0, typeorm_1.Index)(['customerId', 'status']),
    (0, typeorm_1.Index)(['providerId', 'status']),
    (0, typeorm_1.Index)(['scheduledDate', 'scheduledTime']),
    (0, typeorm_1.Index)(['createdAt'])
], Booking);
//# sourceMappingURL=booking.entity.js.map