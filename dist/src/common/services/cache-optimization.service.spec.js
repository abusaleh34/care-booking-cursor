"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const cache_optimization_service_1 = require("./cache-optimization.service");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
jest.mock('ioredis', () => ({
    default: jest.fn().mockImplementation(() => ({
        info: jest.fn().mockResolvedValue(''),
        dbsize: jest.fn().mockResolvedValue(0),
        keys: jest.fn().mockResolvedValue([]),
    })),
}));
describe('CacheOptimizationService', () => {
    let service;
    let mockCacheManager;
    let mockConfigService;
    beforeEach(async () => {
        mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };
        mockConfigService = {
            get: jest.fn().mockImplementation((key) => {
                if (key === 'optimization') {
                    return {
                        cache: {
                            redis: {
                                keyPrefix: 'care_services:',
                            },
                            prefixes: {
                                search: 'search:',
                                provider: 'provider:',
                                category: 'category:',
                                session: 'session:',
                                availability: 'availability:',
                                dashboard: 'dashboard:',
                                static: 'static:',
                            },
                            ttl: {
                                searchResults: 300,
                                providerProfiles: 3600,
                                serviceCategories: 7200,
                                userSessions: 1800,
                                availabilityData: 60,
                                dashboardMetrics: 300,
                                staticContent: 86400,
                            },
                        },
                    };
                }
                return null;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                cache_optimization_service_1.CacheOptimizationService,
                {
                    provide: cache_manager_1.CACHE_MANAGER,
                    useValue: mockCacheManager,
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(cache_optimization_service_1.CacheOptimizationService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('get', () => {
        it('should return cached value when it exists', async () => {
            const key = 'test-key';
            const cachedValue = { data: 'test-data' };
            mockCacheManager.get.mockResolvedValue(cachedValue);
            const result = await service.get(key);
            expect(result).toEqual(cachedValue);
            expect(mockCacheManager.get).toHaveBeenCalledWith('care_services:test-key');
        });
        it('should execute fallback when cache miss', async () => {
            const key = 'test-key';
            const fallbackData = { data: 'fallback-data' };
            const fallback = jest.fn().mockResolvedValue(fallbackData);
            mockCacheManager.get.mockResolvedValue(null);
            mockCacheManager.set.mockResolvedValue(undefined);
            const result = await service.get(key, fallback);
            expect(result).toEqual(fallbackData);
            expect(fallback).toHaveBeenCalled();
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });
    describe('set', () => {
        it('should set cache with default TTL', async () => {
            const key = 'test-key';
            const data = { test: 'data' };
            await service.set(key, data);
            expect(mockCacheManager.set).toHaveBeenCalledWith('care_services:test-key', data, 300000);
        });
        it('should set cache with custom TTL', async () => {
            const key = 'test-key';
            const data = { test: 'data' };
            const ttl = 600;
            await service.set(key, data, ttl);
            expect(mockCacheManager.set).toHaveBeenCalledWith('care_services:test-key', data, 600000);
        });
    });
    describe('del', () => {
        it('should delete cache key', async () => {
            const key = 'test-key';
            await service.del(key);
            expect(mockCacheManager.del).toHaveBeenCalledWith('care_services:test-key');
        });
    });
    describe('getCacheStats', () => {
        it('should handle errors gracefully', async () => {
            const stats = await service.getCacheStats();
            expect(stats).toEqual({
                memory: {},
                keys: 0,
                hitRate: 0,
                keysByPrefix: {},
            });
        });
    });
});
//# sourceMappingURL=cache-optimization.service.spec.js.map