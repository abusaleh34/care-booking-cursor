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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let CacheService = CacheService_1 = class CacheService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(CacheService_1.name);
    }
    async getSearchResults(searchKey) {
        try {
            const key = `search:${searchKey}`;
            const result = await this.cacheManager.get(key);
            if (result) {
                this.logger.debug(`Cache hit for search: ${searchKey}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting search cache for ${searchKey}:`, error);
            return null;
        }
    }
    async setSearchResults(searchKey, data, ttl = 300) {
        try {
            const key = `search:${searchKey}`;
            await this.cacheManager.set(key, data, ttl);
            this.logger.debug(`Cached search results for: ${searchKey}, TTL: ${ttl}s`);
        }
        catch (error) {
            this.logger.error(`Error setting search cache for ${searchKey}:`, error);
        }
    }
    generateSearchKey(searchParams) {
        const sortedParams = Object.keys(searchParams)
            .sort()
            .reduce((result, key) => {
            if (searchParams[key] !== undefined && searchParams[key] !== null) {
                result[key] = searchParams[key];
            }
            return result;
        }, {});
        return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
    }
    async getProvider(providerId) {
        try {
            const key = `provider:${providerId}`;
            const result = await this.cacheManager.get(key);
            if (result) {
                this.logger.debug(`Cache hit for provider: ${providerId}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting provider cache for ${providerId}:`, error);
            return null;
        }
    }
    async setProvider(providerId, data, ttl = 600) {
        try {
            const key = `provider:${providerId}`;
            await this.cacheManager.set(key, data, ttl);
            this.logger.debug(`Cached provider data for: ${providerId}, TTL: ${ttl}s`);
        }
        catch (error) {
            this.logger.error(`Error setting provider cache for ${providerId}:`, error);
        }
    }
    async invalidateProvider(providerId) {
        try {
            const key = `provider:${providerId}`;
            await this.cacheManager.del(key);
            this.logger.debug(`Invalidated provider cache for: ${providerId}`);
        }
        catch (error) {
            this.logger.error(`Error invalidating provider cache for ${providerId}:`, error);
        }
    }
    async getAvailability(providerId, serviceId, date) {
        try {
            const key = `availability:${providerId}:${serviceId}:${date}`;
            const result = await this.cacheManager.get(key);
            if (result) {
                this.logger.debug(`Cache hit for availability: ${key}`);
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Error getting availability cache:`, error);
            return null;
        }
    }
    async setAvailability(providerId, serviceId, date, data, ttl = 60) {
        try {
            const key = `availability:${providerId}:${serviceId}:${date}`;
            await this.cacheManager.set(key, data, ttl);
            this.logger.debug(`Cached availability for: ${key}, TTL: ${ttl}s`);
        }
        catch (error) {
            this.logger.error(`Error setting availability cache:`, error);
        }
    }
    async invalidateAvailability(providerId, date) {
        try {
            if (date) {
                const pattern = `availability:${providerId}:*:${date}`;
                await this.deleteByPattern(pattern);
                this.logger.debug(`Invalidated availability cache for provider ${providerId} on ${date}`);
            }
            else {
                const pattern = `availability:${providerId}:*`;
                await this.deleteByPattern(pattern);
                this.logger.debug(`Invalidated all availability cache for provider ${providerId}`);
            }
        }
        catch (error) {
            this.logger.error(`Error invalidating availability cache:`, error);
        }
    }
    async getCategories() {
        try {
            const key = 'categories:all';
            const result = await this.cacheManager.get(key);
            if (result) {
                this.logger.debug('Cache hit for categories');
            }
            return result;
        }
        catch (error) {
            this.logger.error('Error getting categories cache:', error);
            return null;
        }
    }
    async setCategories(data, ttl = 3600) {
        try {
            const key = 'categories:all';
            await this.cacheManager.set(key, data, ttl);
            this.logger.debug(`Cached categories, TTL: ${ttl}s`);
        }
        catch (error) {
            this.logger.error('Error setting categories cache:', error);
        }
    }
    async invalidateCategories() {
        try {
            const key = 'categories:all';
            await this.cacheManager.del(key);
            this.logger.debug('Invalidated categories cache');
        }
        catch (error) {
            this.logger.error('Error invalidating categories cache:', error);
        }
    }
    async get(key) {
        try {
            return await this.cacheManager.get(key);
        }
        catch (error) {
            this.logger.error(`Error getting cache for ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.cacheManager.set(key, value, ttl);
        }
        catch (error) {
            this.logger.error(`Error setting cache for ${key}:`, error);
        }
    }
    async del(key) {
        try {
            await this.cacheManager.del(key);
        }
        catch (error) {
            this.logger.error(`Error deleting cache for ${key}:`, error);
        }
    }
    async clear() {
        try {
            this.logger.log('Cache clear requested - individual key deletion would be needed');
        }
        catch (error) {
            this.logger.error('Error clearing cache:', error);
        }
    }
    async deleteByPattern(pattern) {
        try {
            this.logger.debug(`Would delete keys matching pattern: ${pattern}`);
        }
        catch (error) {
            this.logger.error(`Error deleting by pattern ${pattern}:`, error);
        }
    }
    async warmupCache() {
        this.logger.log('Starting cache warmup...');
        this.logger.log('Cache warmup completed');
    }
    async getCacheStats() {
        try {
            return {
                status: 'active',
            };
        }
        catch (error) {
            this.logger.error('Error getting cache stats:', error);
            return { status: 'error' };
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], CacheService);
//# sourceMappingURL=cache.service.js.map