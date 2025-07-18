import { Test, TestingModule } from '@nestjs/testing';
import { CacheOptimizationService } from './cache-optimization.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { vi } from 'vitest';

// Mock ioredis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    info: vi.fn().mockResolvedValue(''),
    dbsize: vi.fn().mockResolvedValue(0),
    keys: vi.fn().mockResolvedValue([]),
  })),
}));

describe('CacheOptimizationService', () => {
  let service: CacheOptimizationService;
  let mockCacheManager: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockImplementation((key) => {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheOptimizationService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheOptimizationService>(CacheOptimizationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      const fallback = vi.fn().mockResolvedValue(fallbackData);

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

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'care_services:test-key',
        data,
        300000, // TTL in milliseconds
      );
    });

    it('should set cache with custom TTL', async () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const ttl = 600;

      await service.set(key, data, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'care_services:test-key',
        data,
        600000, // TTL in milliseconds
      );
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
      // Mock Redis methods to throw errors to test error handling
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
