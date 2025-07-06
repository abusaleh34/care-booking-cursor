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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const service_entity_1 = require("../../database/entities/service.entity");
const service_category_entity_1 = require("../../database/entities/service-category.entity");
const search_providers_dto_1 = require("../dto/search-providers.dto");
const cache_service_1 = require("../../cache/cache.service");
let SearchService = SearchService_1 = class SearchService {
    constructor(serviceProviderRepository, serviceRepository, serviceCategoryRepository, cacheService) {
        this.serviceProviderRepository = serviceProviderRepository;
        this.serviceRepository = serviceRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.cacheService = cacheService;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async searchProviders(searchDto) {
        const cacheKey = this.cacheService.generateSearchKey(searchDto);
        const cachedResults = await this.cacheService.getSearchResults(cacheKey);
        if (cachedResults) {
            this.logger.debug('Returning cached search results');
            return cachedResults;
        }
        try {
            const query = this.buildSearchQuery(searchDto);
            const total = await query.getCount();
            query.skip(searchDto.offset || 0).take(searchDto.limit || 20);
            const providers = await query.getMany();
            const results = await this.transformProviderResults(providers, searchDto);
            await this.cacheService.setSearchResults(cacheKey, results, 300);
            return {
                providers: results,
                total,
                page: Math.floor((searchDto.offset || 0) / (searchDto.limit || 20)) + 1,
                limit: searchDto.limit || 20,
                hasMore: (searchDto.offset || 0) + (searchDto.limit || 20) < total,
            };
        }
        catch (error) {
            this.logger.error('Error searching providers:', error);
            throw error;
        }
    }
    async getProviderDetails(providerId, latitude, longitude) {
        const cacheKey = `${providerId}_${latitude || 'no'}_${longitude || 'no'}`;
        const cachedProvider = await this.cacheService.getProvider(cacheKey);
        if (cachedProvider) {
            this.logger.debug(`Returning cached provider details for ${providerId}`);
            return cachedProvider;
        }
        try {
            const provider = await this.serviceProviderRepository.findOne({
                where: { id: providerId, isActive: true },
                relations: ['user', 'user.profile', 'services', 'services.category'],
            });
            if (!provider) {
                return null;
            }
            const result = this.transformSingleProviderResult(provider, latitude, longitude);
            await this.cacheService.setProvider(cacheKey, result, 600);
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting provider details for ${providerId}:`, error);
            throw error;
        }
    }
    async getServiceCategories() {
        return this.serviceCategoryRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }
    async getCategories() {
        const cachedCategories = await this.cacheService.getCategories();
        if (cachedCategories) {
            this.logger.debug('Returning cached categories');
            return cachedCategories;
        }
        const categories = await this.serviceCategoryRepository
            .createQueryBuilder('category')
            .leftJoin('category.services', 'services')
            .addSelect('COUNT(DISTINCT services.id)', 'serviceCount')
            .where('category.isActive = :isActive', { isActive: true })
            .groupBy('category.id')
            .orderBy('category.name', 'ASC')
            .getRawAndEntities();
        const results = categories.entities.map((category, index) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            iconUrl: category.iconUrl,
            serviceCount: parseInt(categories.raw[index].serviceCount) || 0,
        }));
        await this.cacheService.setCategories(results, 3600);
        return results;
    }
    buildSearchQuery(searchDto) {
        const query = this.serviceProviderRepository
            .createQueryBuilder('provider')
            .leftJoinAndSelect('provider.services', 'service', 'service.isActive = :serviceActive', {
            serviceActive: true,
        })
            .leftJoinAndSelect('service.category', 'category')
            .leftJoinAndSelect('provider.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('provider.isActive = :active', { active: true });
        if (searchDto.query) {
            query.andWhere('(provider.businessName ILIKE :query OR provider.businessDescription ILIKE :query OR service.name ILIKE :query)', { query: `%${searchDto.query}%` });
        }
        if (searchDto.categoryId) {
            query.andWhere('service.categoryId = :categoryId', { categoryId: searchDto.categoryId });
        }
        if (searchDto.minRating) {
            query.andWhere('provider.averageRating >= :minRating', { minRating: searchDto.minRating });
        }
        if (searchDto.minPrice) {
            query.andWhere('service.price >= :minPrice', { minPrice: searchDto.minPrice });
        }
        if (searchDto.maxPrice) {
            query.andWhere('service.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
        }
        if (searchDto.isHomeService !== undefined) {
            query.andWhere('service.isHomeService = :isHomeService', {
                isHomeService: searchDto.isHomeService,
            });
        }
        if (searchDto.verifiedOnly) {
            query.andWhere('provider.isVerified = :verified', { verified: true });
        }
        if (searchDto.serviceIds && searchDto.serviceIds.length > 0) {
            query.andWhere('service.id IN (:...serviceIds)', { serviceIds: searchDto.serviceIds });
        }
        if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
            query.andWhere(`(6371 * acos(cos(radians(:lat)) * cos(radians(provider.latitude)) * cos(radians(provider.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(provider.latitude)))) <= :radius`, {
                lat: searchDto.latitude,
                lng: searchDto.longitude,
                radius: searchDto.radius,
            });
        }
        this.applySorting(query, searchDto);
        return query;
    }
    applySorting(query, searchDto) {
        const sortOrder = searchDto.sortOrder === search_providers_dto_1.SortOrder.DESC ? 'DESC' : 'ASC';
        switch (searchDto.sortBy) {
            case search_providers_dto_1.SortBy.RATING:
                query.orderBy('provider.averageRating', sortOrder);
                break;
            case search_providers_dto_1.SortBy.REVIEWS:
                query.orderBy('provider.totalReviews', sortOrder);
                break;
            case search_providers_dto_1.SortBy.PRICE:
                query.orderBy('service.price', sortOrder);
                break;
            case search_providers_dto_1.SortBy.NEWEST:
                query.orderBy('provider.createdAt', sortOrder);
                break;
            case search_providers_dto_1.SortBy.DISTANCE:
            default:
                if (searchDto.latitude && searchDto.longitude) {
                    query.orderBy(`(6371 * acos(cos(radians(${searchDto.latitude})) * cos(radians(provider.latitude)) * cos(radians(provider.longitude) - radians(${searchDto.longitude})) + sin(radians(${searchDto.latitude})) * sin(radians(provider.latitude))))`, sortOrder);
                }
                else {
                    query.orderBy('provider.averageRating', 'DESC');
                }
                break;
        }
        if (searchDto.sortBy !== search_providers_dto_1.SortBy.RATING) {
            query.addOrderBy('provider.averageRating', 'DESC');
        }
    }
    async transformProviderResults(providers, searchDto) {
        return providers.map((provider) => this.transformSingleProviderResult(provider, searchDto.latitude, searchDto.longitude));
    }
    transformSingleProviderResult(provider, latitude, longitude) {
        const distance = latitude && longitude && provider.latitude && provider.longitude
            ? this.calculateDistance(latitude, longitude, provider.latitude, provider.longitude)
            : undefined;
        return {
            id: provider.id,
            businessName: provider.businessName,
            businessDescription: provider.businessDescription,
            businessAddress: provider.businessAddress,
            averageRating: provider.averageRating,
            totalReviews: provider.totalReviews,
            isVerified: provider.isVerified,
            distance,
            location: provider.latitude && provider.longitude
                ? {
                    latitude: provider.latitude,
                    longitude: provider.longitude,
                }
                : null,
            services: provider.services?.map((service) => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price,
                durationMinutes: service.durationMinutes,
                isHomeService: service.isHomeService,
                category: service.category
                    ? {
                        id: service.category.id,
                        name: service.category.name,
                        iconUrl: service.category.iconUrl,
                    }
                    : null,
            })) || [],
        };
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    async invalidateProviderCache(providerId) {
        await this.cacheService.invalidateProvider(providerId);
        this.logger.debug(`Invalidated caches for provider ${providerId}`);
    }
    async invalidateCategoriesCache() {
        await this.cacheService.invalidateCategories();
        this.logger.debug('Invalidated categories cache');
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(2, (0, typeorm_1.InjectRepository)(service_category_entity_1.ServiceCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService])
], SearchService);
//# sourceMappingURL=search.service.js.map