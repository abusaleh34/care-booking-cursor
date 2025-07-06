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
var CacheOptimizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const ioredis_1 = require("ioredis");
let CacheOptimizationService = CacheOptimizationService_1 = class CacheOptimizationService {
    constructor(cacheManager, configService) {
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.logger = new common_1.Logger(CacheOptimizationService_1.name);
        this.config = this.configService.get('optimization');
        this.redis = new ioredis_1.default({
            ...this.config.cache.redis,
            lazyConnect: true,
        });
    }
    async get(key, fallback, ttl, prefix) {
        const fullKey = this.buildKey(key, prefix);
        try {
            const cached = await this.cacheManager.get(fullKey);
            if (cached !== null && cached !== undefined) {
                this.logger.debug(`Cache hit: ${fullKey}`);
                return cached;
            }
            if (fallback) {
                this.logger.debug(`Cache miss: ${fullKey}, executing fallback`);
                const data = await fallback();
                if (data !== null && data !== undefined) {
                    await this.set(key, data, ttl, prefix);
                }
                return data;
            }
            return null;
        }
        catch (error) {
            this.logger.error(`Cache get error for key ${fullKey}:`, error);
            if (fallback) {
                return await fallback();
            }
            return null;
        }
    }
    async set(key, value, ttl, prefix) {
        const fullKey = this.buildKey(key, prefix);
        const finalTtl = ttl || this.getDefaultTTL(prefix);
        try {
            await this.cacheManager.set(fullKey, value, finalTtl * 1000);
            this.logger.debug(`Cache set: ${fullKey} (TTL: ${finalTtl}s)`);
        }
        catch (error) {
            this.logger.error(`Cache set error for key ${fullKey}:`, error);
        }
    }
    async del(key, prefix) {
        const fullKey = this.buildKey(key, prefix);
        try {
            await this.cacheManager.del(fullKey);
            this.logger.debug(`Cache deleted: ${fullKey}`);
        }
        catch (error) {
            this.logger.error(`Cache delete error for key ${fullKey}:`, error);
        }
    }
    async mset(items) {
        const pipeline = this.redis.pipeline();
        for (const item of items) {
            const fullKey = this.buildKey(item.key, item.prefix);
            const ttl = item.ttl || this.getDefaultTTL(item.prefix);
            pipeline.setex(fullKey, ttl, JSON.stringify(item.value));
        }
        try {
            await pipeline.exec();
            this.logger.debug(`Bulk cache set: ${items.length} items`);
        }
        catch (error) {
            this.logger.error('Bulk cache set error:', error);
        }
    }
    async mget(keys) {
        const fullKeys = keys.map((k) => this.buildKey(k.key, k.prefix));
        const result = {};
        try {
            const values = await this.redis.mget(fullKeys);
            keys.forEach((keyInfo, index) => {
                const originalKey = keyInfo.key;
                const value = values[index];
                if (value) {
                    try {
                        result[originalKey] = JSON.parse(value);
                    }
                    catch {
                        result[originalKey] = value;
                    }
                }
                else {
                    result[originalKey] = null;
                }
            });
            return result;
        }
        catch (error) {
            this.logger.error('Bulk cache get error:', error);
            return Object.fromEntries(keys.map((k) => [k.key, null]));
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.redis.del(keys);
            this.logger.debug(`Cache pattern invalidated: ${pattern} (${keys.length} keys)`);
            return keys.length;
        }
        catch (error) {
            this.logger.error(`Cache pattern invalidation error for ${pattern}:`, error);
            return 0;
        }
    }
    async warmCache(warmingStrategy) {
        this.logger.log(`Starting cache warming for ${warmingStrategy.length} keys`);
        const promises = warmingStrategy.map(async (strategy) => {
            try {
                const data = await strategy.loader();
                await this.set(strategy.key, data, strategy.ttl, strategy.prefix);
            }
            catch (error) {
                this.logger.error(`Cache warming failed for key ${strategy.key}:`, error);
            }
        });
        await Promise.allSettled(promises);
        this.logger.log('Cache warming completed');
    }
    async getCacheStats() {
        try {
            const memoryInfo = await this.redis.info('memory');
            const keys = await this.redis.dbsize();
            const prefixes = Object.values(this.config.cache.prefixes || {});
            const keysByPrefix = {};
            for (const prefix of prefixes) {
                const prefixKeys = await this.redis.keys(`${this.config.cache.redis.keyPrefix}${prefix}*`);
                keysByPrefix[String(prefix)] = prefixKeys.length;
            }
            return {
                memory: this.parseMemoryInfo(memoryInfo),
                keys: keys,
                hitRate: await this.calculateHitRate(),
                keysByPrefix,
            };
        }
        catch (error) {
            this.logger.error('Failed to get cache stats:', error);
            return {
                memory: {},
                keys: 0,
                hitRate: 0,
                keysByPrefix: {},
            };
        }
    }
    async cleanup() {
        let deletedKeys = 0;
        let freedMemory = 0;
        try {
            const memoryBefore = await this.getUsedMemoryBytes();
            const keys = await this.redis.keys(`${this.config.cache.redis.keyPrefix}*`);
            const pipeline = this.redis.pipeline();
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl === -1) {
                    const keyAge = await this.getKeyAge(key);
                    if (keyAge > 86400) {
                        pipeline.del(key);
                        deletedKeys++;
                    }
                }
            }
            if (deletedKeys > 0) {
                await pipeline.exec();
                const memoryAfter = await this.getUsedMemoryBytes();
                freedMemory = memoryBefore - memoryAfter;
                this.logger.log(`Cache cleanup: deleted ${deletedKeys} keys, freed ${freedMemory} bytes`);
            }
        }
        catch (error) {
            this.logger.error('Cache cleanup error:', error);
        }
        return { deletedKeys, freedMemory };
    }
    parseMemoryInfo(info) {
        const memoryData = {};
        const lines = info.split('\r\n');
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                memoryData[key] = value;
            }
        }
        return memoryData;
    }
    async getUsedMemoryBytes() {
        try {
            const info = await this.redis.info('memory');
            const lines = info.split('\r\n');
            for (const line of lines) {
                if (line.startsWith('used_memory:')) {
                    return parseInt(line.split(':')[1]);
                }
            }
            return 0;
        }
        catch {
            return 0;
        }
    }
    async smartPreload(accessPatterns) {
        accessPatterns.sort((a, b) => b.priority - a.priority);
        for (const pattern of accessPatterns) {
            try {
                const keys = await this.redis.keys(pattern.keyPattern);
                const loadPromises = keys.slice(0, 10).map(async (key) => {
                    const data = await pattern.loader(key);
                    await this.redis.set(key, JSON.stringify(data));
                });
                await Promise.allSettled(loadPromises);
            }
            catch (error) {
                this.logger.error(`Smart preload error for pattern ${pattern.keyPattern}:`, error);
            }
        }
    }
    buildKey(key, prefix) {
        const keyPrefix = this.config.cache.redis.keyPrefix;
        const cachePrefix = prefix || '';
        return `${keyPrefix}${cachePrefix}${key}`;
    }
    getDefaultTTL(prefix) {
        const ttlMap = this.config.cache.ttl;
        switch (prefix) {
            case this.config.cache.prefixes.search:
                return ttlMap.searchResults;
            case this.config.cache.prefixes.provider:
                return ttlMap.providerProfiles;
            case this.config.cache.prefixes.category:
                return ttlMap.serviceCategories;
            case this.config.cache.prefixes.session:
                return ttlMap.userSessions;
            case this.config.cache.prefixes.availability:
                return ttlMap.availabilityData;
            case this.config.cache.prefixes.dashboard:
                return ttlMap.dashboardMetrics;
            case this.config.cache.prefixes.static:
                return ttlMap.staticContent;
            default:
                return ttlMap.searchResults;
        }
    }
    async calculateHitRate() {
        try {
            const info = await this.redis.info('stats');
            const lines = info.split('\r\n');
            let hits = 0;
            let misses = 0;
            for (const line of lines) {
                if (line.startsWith('keyspace_hits:')) {
                    hits = parseInt(line.split(':')[1]);
                }
                if (line.startsWith('keyspace_misses:')) {
                    misses = parseInt(line.split(':')[1]);
                }
            }
            return hits + misses > 0 ? hits / (hits + misses) : 0;
        }
        catch {
            return 0;
        }
    }
    async getKeyAge(key) {
        try {
            return 0;
        }
        catch {
            return 0;
        }
    }
};
exports.CacheOptimizationService = CacheOptimizationService;
exports.CacheOptimizationService = CacheOptimizationService = CacheOptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], CacheOptimizationService);
//# sourceMappingURL=cache-optimization.service.js.map