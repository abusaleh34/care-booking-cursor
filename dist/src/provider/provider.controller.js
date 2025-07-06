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
exports.ProviderController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_entity_1 = require("../database/entities/user-role.entity");
const provider_dashboard_service_1 = require("./services/provider-dashboard.service");
const provider_business_service_1 = require("./services/provider-business.service");
const provider_booking_service_1 = require("./services/provider-booking.service");
const provider_messaging_service_1 = require("./services/provider-messaging.service");
const provider_dto_1 = require("./dto/provider.dto");
let ProviderController = class ProviderController {
    async getProviderId(userId) {
        const provider = await this.businessService.getProviderByUserId(userId);
        if (!provider) {
            throw new common_1.NotFoundException('Service provider profile not found');
        }
        return provider.id;
    }
    constructor(dashboardService, businessService, bookingService, messagingService) {
        this.dashboardService = dashboardService;
        this.businessService = businessService;
        this.bookingService = bookingService;
        this.messagingService = messagingService;
    }
    async getDashboard(req) {
        const provider = await this.businessService.getProviderByUserId(req.user.sub);
        if (!provider) {
            throw new common_1.NotFoundException('Service provider profile not found');
        }
        return await this.dashboardService.getDashboardOverview(provider.id);
    }
    async getAnalytics(req, filter) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.dashboardService.getAnalyticsData(providerId, filter);
    }
    async getEarnings(req, filter) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.dashboardService.getEarningsData(providerId, filter);
    }
    async getBusinessProfile(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.getBusinessProfile(providerId);
    }
    async updateBusinessProfile(req, updateData) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.updateBusinessProfile(providerId, updateData);
    }
    async getServices(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.getServices(providerId);
    }
    async createService(req, createServiceDto) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.createService(providerId, createServiceDto);
    }
    async updateService(req, serviceId, updateServiceDto) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.updateService(providerId, serviceId, updateServiceDto);
    }
    async deleteService(req, serviceId) {
        const providerId = await this.getProviderId(req.user.sub);
        await this.businessService.deleteService(providerId, serviceId);
    }
    async getServicePerformance(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.getServicePerformance(providerId);
    }
    async getAvailability(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.getAvailability(providerId);
    }
    async setAvailability(req, setAvailabilityDto) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.setAvailability(providerId, setAvailabilityDto);
    }
    async getBlockedTimes(req, startDate, endDate) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.getBlockedTimes(providerId, startDate, endDate);
    }
    async blockTime(req, blockTimeDto) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.blockTime(providerId, blockTimeDto);
    }
    async unblockTime(req, blockedTimeId) {
        const providerId = await this.getProviderId(req.user.sub);
        await this.businessService.unblockTime(providerId, blockedTimeId);
    }
    async getBookings(req, query) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.getBookings(providerId, query);
    }
    async getTodayBookings(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.getTodayBookings(providerId);
    }
    async getUpcomingBookings(req, days) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.getUpcomingBookings(providerId, days);
    }
    async getBookingById(req, bookingId) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.getBookingById(providerId, bookingId);
    }
    async handleBookingAction(req, bookingId, action) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.handleBookingAction(providerId, bookingId, action);
    }
    async startService(req, bookingId) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.startService(providerId, bookingId);
    }
    async requestReschedule(req, rescheduleDto) {
        const providerId = await this.getProviderId(req.user.sub);
        await this.bookingService.requestReschedule(providerId, rescheduleDto);
        return { message: 'Reschedule request sent to customer' };
    }
    async getProviderCalendar(req, startDate, endDate) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.bookingService.getProviderCalendar(providerId, startDate, endDate);
    }
    async getConversations(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.getConversations(providerId);
    }
    async createConversation(req, createConversationDto) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.createConversation(providerId, createConversationDto);
    }
    async getConversationById(req, conversationId) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.getConversationById(providerId, conversationId);
    }
    async getMessages(req, conversationId, query) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.getMessages(providerId, conversationId, query);
    }
    async sendMessage(req, conversationId, sendMessageDto) {
        const providerId = await this.getProviderId(req.user.sub);
        const fullMessageDto = { ...sendMessageDto, conversationId };
        return await this.messagingService.addMessage(providerId, fullMessageDto);
    }
    async markMessagesAsRead(req, conversationId) {
        const providerId = await this.getProviderId(req.user.sub);
        await this.messagingService.markMessagesAsRead(providerId, conversationId);
    }
    async getConversationStats(req) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.getConversationStats(providerId);
    }
    async searchConversations(req, searchTerm) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.messagingService.searchConversations(providerId, searchTerm);
    }
    async uploadPortfolioImage(req, imageUrl) {
        const providerId = await this.getProviderId(req.user.sub);
        return await this.businessService.uploadPortfolioImage(providerId, imageUrl);
    }
    async deletePortfolioImage(req, imageUrl) {
        const providerId = await this.getProviderId(req.user.sub);
        await this.businessService.deletePortfolioImage(providerId, imageUrl);
    }
};
exports.ProviderController = ProviderController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.AnalyticsFilterDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('earnings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.EarningsFilterDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getBusinessProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.UpdateBusinessProfileDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "updateBusinessProfile", null);
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getServices", null);
__decorate([
    (0, common_1.Post)('services'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.CreateServiceDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "createService", null);
__decorate([
    (0, common_1.Put)('services/:serviceId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, provider_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:serviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('serviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Get)('services/performance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getServicePerformance", null);
__decorate([
    (0, common_1.Get)('availability'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Put)('availability'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.SetAvailabilityDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Get)('blocked-times'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getBlockedTimes", null);
__decorate([
    (0, common_1.Post)('blocked-times'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.BlockTimeDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "blockTime", null);
__decorate([
    (0, common_1.Delete)('blocked-times/:blockedTimeId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('blockedTimeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "unblockTime", null);
__decorate([
    (0, common_1.Get)('bookings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.BookingsQueryDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Get)('bookings/today'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getTodayBookings", null);
__decorate([
    (0, common_1.Get)('bookings/upcoming'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getUpcomingBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:bookingId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getBookingById", null);
__decorate([
    (0, common_1.Post)('bookings/:bookingId/action'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, provider_dto_1.BookingActionDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "handleBookingAction", null);
__decorate([
    (0, common_1.Post)('bookings/:bookingId/start'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "startService", null);
__decorate([
    (0, common_1.Post)('bookings/reschedule'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.RescheduleRequestDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "requestReschedule", null);
__decorate([
    (0, common_1.Get)('calendar'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getProviderCalendar", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Post)('conversations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, provider_dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getConversationById", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, provider_dto_1.MessagesQueryDto]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Put)('conversations/:conversationId/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "markMessagesAsRead", null);
__decorate([
    (0, common_1.Get)('conversations/stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "getConversationStats", null);
__decorate([
    (0, common_1.Get)('conversations/search'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "searchConversations", null);
__decorate([
    (0, common_1.Post)('portfolio/images'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('imageUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "uploadPortfolioImage", null);
__decorate([
    (0, common_1.Delete)('portfolio/images'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('imageUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProviderController.prototype, "deletePortfolioImage", null);
exports.ProviderController = ProviderController = __decorate([
    (0, common_1.Controller)('provider'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.SERVICE_PROVIDER),
    __metadata("design:paramtypes", [provider_dashboard_service_1.ProviderDashboardService,
        provider_business_service_1.ProviderBusinessService,
        provider_booking_service_1.ProviderBookingService,
        provider_messaging_service_1.ProviderMessagingService])
], ProviderController);
//# sourceMappingURL=provider.controller.js.map