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
exports.ProviderBusinessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const service_entity_1 = require("../../database/entities/service.entity");
const provider_availability_entity_1 = require("../../database/entities/provider-availability.entity");
const provider_blocked_times_entity_1 = require("../../database/entities/provider-blocked-times.entity");
const cache_service_1 = require("../../cache/cache.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
let ProviderBusinessService = class ProviderBusinessService {
    constructor(providerRepository, serviceRepository, availabilityRepository, blockedTimesRepository, cacheService, realtimeGateway) {
        this.providerRepository = providerRepository;
        this.serviceRepository = serviceRepository;
        this.availabilityRepository = availabilityRepository;
        this.blockedTimesRepository = blockedTimesRepository;
        this.cacheService = cacheService;
        this.realtimeGateway = realtimeGateway;
    }
    async getProviderByUserId(userId) {
        return await this.providerRepository.findOne({
            where: { userId },
        });
    }
    async getBusinessProfile(providerId) {
        const cached = await this.cacheService.getProvider(providerId);
        if (cached)
            return cached;
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['user', 'services', 'reviews'],
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.cacheService.setProvider(providerId, provider, 600);
        return provider;
    }
    async updateBusinessProfile(providerId, updateData) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.providerRepository.update(providerId, {
            ...(updateData.businessName && { businessName: updateData.businessName }),
            ...(updateData.businessDescription && {
                businessDescription: updateData.businessDescription,
            }),
            ...(updateData.businessAddress && { businessAddress: updateData.businessAddress }),
            ...(updateData.latitude && { latitude: updateData.latitude }),
            ...(updateData.longitude && { longitude: updateData.longitude }),
            ...(updateData.businessPhone && { businessPhone: updateData.businessPhone }),
            ...(updateData.businessEmail && { businessEmail: updateData.businessEmail }),
        });
        await this.cacheService.invalidateProvider(providerId);
        const updatedProvider = await this.getBusinessProfile(providerId);
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'profile_updated',
            data: updatedProvider,
        });
        return updatedProvider;
    }
    async getServices(providerId) {
        const services = await this.serviceRepository.find({
            where: { providerId },
            relations: ['category'],
            order: { createdAt: 'DESC' },
        });
        return services;
    }
    async createService(providerId, createServiceDto) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const service = this.serviceRepository.create({
            ...createServiceDto,
            providerId,
            isActive: createServiceDto.isActive ?? true,
        });
        const savedService = await this.serviceRepository.save(service);
        await this.cacheService.invalidateProvider(providerId);
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'service_created',
            data: savedService,
        });
        return savedService;
    }
    async updateService(providerId, serviceId, updateServiceDto) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, providerId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        await this.serviceRepository.update(serviceId, updateServiceDto);
        await this.cacheService.invalidateProvider(providerId);
        const updatedService = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: ['category'],
        });
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'service_updated',
            data: updatedService,
        });
        return updatedService;
    }
    async deleteService(providerId, serviceId) {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId, providerId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        await this.serviceRepository.delete(serviceId);
        await this.cacheService.invalidateProvider(providerId);
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'service_deleted',
            data: { serviceId },
        });
    }
    async getAvailability(providerId) {
        return await this.availabilityRepository.find({
            where: { provider_id: providerId },
            order: { day_of_week: 'ASC', start_time: 'ASC' },
        });
    }
    async setAvailability(providerId, setAvailabilityDto) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.availabilityRepository.delete({ provider_id: providerId });
        const availabilitySlots = setAvailabilityDto.availability.map((slot) => this.availabilityRepository.create({
            provider_id: providerId,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            is_available: slot.isAvailable ?? true,
        }));
        const savedSlots = await this.availabilityRepository.save(availabilitySlots);
        await this.cacheService.invalidateAvailability(providerId);
        this.realtimeGateway.notifyAvailabilityChange(providerId, '', {
            type: 'availability_updated',
            data: savedSlots,
        });
        return savedSlots;
    }
    async getBlockedTimes(providerId, startDate, endDate) {
        const query = this.blockedTimesRepository
            .createQueryBuilder('blocked')
            .where('blocked.provider_id = :providerId', { providerId });
        if (startDate) {
            query.andWhere('blocked.blocked_date >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('blocked.blocked_date <= :endDate', { endDate });
        }
        return await query
            .orderBy('blocked.blocked_date', 'ASC')
            .addOrderBy('blocked.start_time', 'ASC')
            .getMany();
    }
    async blockTime(providerId, blockTimeDto) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const blockDate = new Date(blockTimeDto.blockedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (blockDate < today) {
            throw new common_1.BadRequestException('Cannot block time in the past');
        }
        const blockedTime = this.blockedTimesRepository.create({
            provider_id: providerId,
            blocked_date: blockDate,
            start_time: blockTimeDto.startTime,
            end_time: blockTimeDto.endTime,
            reason: blockTimeDto.reason,
            is_recurring: blockTimeDto.isRecurring ?? false,
        });
        const savedBlockedTime = await this.blockedTimesRepository.save(blockedTime);
        await this.cacheService.invalidateAvailability(providerId, blockTimeDto.blockedDate);
        this.realtimeGateway.notifyAvailabilityChange(providerId, blockTimeDto.blockedDate, {
            type: 'time_blocked',
            date: blockTimeDto.blockedDate,
            data: savedBlockedTime,
        });
        return savedBlockedTime;
    }
    async unblockTime(providerId, blockedTimeId) {
        const blockedTime = await this.blockedTimesRepository.findOne({
            where: { id: blockedTimeId, provider_id: providerId },
        });
        if (!blockedTime) {
            throw new common_1.NotFoundException('Blocked time not found');
        }
        const blockedDate = blockedTime.blocked_date.toISOString().split('T')[0];
        await this.blockedTimesRepository.delete(blockedTimeId);
        await this.cacheService.invalidateAvailability(providerId, blockedDate);
        this.realtimeGateway.notifyAvailabilityChange(providerId, blockedDate, {
            type: 'time_unblocked',
            date: blockedDate,
            data: { blockedTimeId },
        });
    }
    async uploadPortfolioImage(providerId, imageUrl) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.cacheService.invalidateProvider(providerId);
        const updatedProvider = await this.getBusinessProfile(providerId);
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'portfolio_updated',
            data: { imageUrl },
        });
        return updatedProvider;
    }
    async deletePortfolioImage(providerId, imageUrl) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        await this.cacheService.invalidateProvider(providerId);
        this.realtimeGateway.notifyProviderUpdated(providerId, {
            type: 'portfolio_updated',
            data: { deletedImageUrl: imageUrl },
        });
    }
    async getServicePerformance(providerId) {
        const services = await this.serviceRepository
            .createQueryBuilder('service')
            .leftJoin('service.bookings', 'booking')
            .leftJoin('service.reviews', 'review')
            .where('service.providerId = :providerId', { providerId })
            .select([
            'service.id',
            'service.name',
            'service.price',
            'COUNT(DISTINCT booking.id) as totalBookings',
            'COUNT(DISTINCT CASE WHEN booking.status = "completed" THEN booking.id END) as completedBookings',
            'AVG(CASE WHEN booking.status = "completed" THEN booking.totalAmount END) as averageRevenue',
            'AVG(review.rating) as averageRating',
            'COUNT(DISTINCT review.id) as totalReviews',
        ])
            .groupBy('service.id')
            .getRawMany();
        return services.map((service) => ({
            ...service,
            completionRate: service.totalBookings > 0 ? service.completedBookings / service.totalBookings : 0,
        }));
    }
};
exports.ProviderBusinessService = ProviderBusinessService;
exports.ProviderBusinessService = ProviderBusinessService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(2, (0, typeorm_1.InjectRepository)(provider_availability_entity_1.ProviderAvailability)),
    __param(3, (0, typeorm_1.InjectRepository)(provider_blocked_times_entity_1.ProviderBlockedTimes)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService,
        websocket_gateway_1.RealtimeGateway])
], ProviderBusinessService);
//# sourceMappingURL=provider-business.service.js.map