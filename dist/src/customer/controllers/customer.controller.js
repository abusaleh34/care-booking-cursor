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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const search_service_1 = require("../services/search.service");
const booking_service_1 = require("../services/booking.service");
const payment_service_1 = require("../services/payment.service");
const search_providers_dto_1 = require("../dto/search-providers.dto");
const create_booking_dto_1 = require("../dto/create-booking.dto");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
const user_role_entity_1 = require("../../database/entities/user-role.entity");
let CustomerController = class CustomerController {
    constructor(searchService, bookingService, paymentService) {
        this.searchService = searchService;
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }
    async getCategories() {
        const categories = await this.searchService.getCategories();
        return {
            success: true,
            data: categories,
        };
    }
    async searchProviders(searchDto) {
        const providers = await this.searchService.searchProviders(searchDto);
        return {
            success: true,
            data: providers,
        };
    }
    async getProviderDetails(params) {
        const provider = await this.searchService.getProviderDetails(params.providerId);
        return {
            success: true,
            data: provider,
        };
    }
    async getAvailability(getAvailabilityDto) {
        const availability = await this.bookingService.getAvailability(getAvailabilityDto);
        return {
            success: true,
            data: availability,
        };
    }
    async createBooking(createBookingDto, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        const booking = await this.bookingService.createBooking(user.sub || user.id, createBookingDto, ipAddress, userAgent);
        return {
            success: true,
            message: 'Booking created successfully',
            data: booking,
        };
    }
    async getUserBookings(user) {
        const bookings = await this.bookingService.getUserBookings(user.sub || user.id);
        return {
            success: true,
            data: bookings,
        };
    }
    async getBookingDetails(bookingId, user) {
        const booking = await this.bookingService.getBookingDetails(bookingId, user.sub || user.id);
        return {
            success: true,
            data: booking,
        };
    }
    async rescheduleBooking(bookingId, rescheduleBookingDto, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        const booking = await this.bookingService.rescheduleBooking(user.id, { ...rescheduleBookingDto, bookingId }, ipAddress, userAgent);
        return {
            success: true,
            message: 'Booking rescheduled successfully',
            data: booking,
        };
    }
    async cancelBooking(bookingId, cancelDto, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        await this.bookingService.cancelBooking(user.id, { ...cancelDto, bookingId }, ipAddress, userAgent);
        return {
            success: true,
            message: 'Booking cancelled successfully',
        };
    }
    async getCustomerProfile(user) {
        return {
            success: true,
            data: {
                id: user.id,
                email: user.email,
                profile: user.profile,
                roles: user.roles,
                isVerified: user.isVerified,
            },
        };
    }
    async processPayment(paymentDto, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        const result = await this.paymentService.processPayment(user.id, paymentDto, ipAddress, userAgent);
        return {
            success: result.success,
            message: result.success
                ? 'Payment processed successfully'
                : 'Payment requires additional authentication',
            data: result,
        };
    }
    async confirmPayment(paymentIntentId, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        const result = await this.paymentService.confirmPayment(user.id, paymentIntentId, ipAddress, userAgent);
        return {
            success: true,
            message: 'Payment confirmed successfully',
            data: result,
        };
    }
    async processRefund(body, user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.get('User-Agent') || '';
        const result = await this.paymentService.processRefund(body.bookingId, user.id, body.reason, ipAddress, userAgent);
        return {
            success: true,
            message: 'Refund processed successfully',
            data: result,
        };
    }
    async handleStripeWebhook(signature, payload) {
        await this.paymentService.handleWebhook(signature, payload);
        return { received: true };
    }
    async getRecommendations(user, query) {
        const searchDto = {
            latitude: query.latitude,
            longitude: query.longitude,
            radius: 10,
            verifiedOnly: true,
            sortBy: 'rating',
            sortOrder: 'desc',
            limit: query.limit || 10,
        };
        const results = await this.searchService.searchProviders(searchDto);
        return {
            success: true,
            message: 'Top-rated providers near you',
            data: results,
        };
    }
    async getSearchSuggestions(query) {
        if (!query || query.length < 2) {
            return {
                success: true,
                data: [],
            };
        }
        const suggestions = [
            'Massage Therapy',
            'Hair Styling',
            'Nail Care',
            'Facial Treatment',
            'Personal Training',
            'Yoga Instruction',
            'Spa Services',
            'Beauty Consultation',
        ].filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase()));
        return {
            success: true,
            data: suggestions,
        };
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('categories'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCategories", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_providers_dto_1.SearchProvidersDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "searchProviders", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('providers/:providerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_providers_dto_1.GetProviderDetailsDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getProviderDetails", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('availability'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.GetAvailabilityDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Post)('bookings'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.CreateBookingDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "createBooking", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Get)('bookings'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getUserBookings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Get)('bookings/:bookingId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getBookingDetails", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Put)('bookings/:bookingId/reschedule'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "rescheduleBooking", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Delete)('bookings/:bookingId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Get)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCustomerProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Post)('payments/process'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_booking_dto_1.PaymentDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "processPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Post)('payments/:paymentIntentId/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('paymentIntentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Post)('payments/refund'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "processRefund", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('payments/webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('stripe-signature')),
    __param(1, (0, common_1.RawBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Buffer]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.CUSTOMER),
    (0, common_1.Get)('recommendations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getRecommendations", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('suggestions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getSearchSuggestions", null);
exports.CustomerController = CustomerController = __decorate([
    (0, common_1.Controller)('customer'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        booking_service_1.BookingService,
        payment_service_1.PaymentService])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map