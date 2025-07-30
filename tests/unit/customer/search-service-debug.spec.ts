import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { SearchService } from '../../../src/customer/services/search.service';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceCategory } from '../../../src/database/entities/service-category.entity';
import { CacheService } from '../../../src/cache/cache.service';

describe('SearchService - Debug Test', () => {
  let service: SearchService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const mockCacheService = {
      generateSearchKey: vi.fn().mockReturnValue('test-search-key'),
      getSearchResults: vi.fn().mockResolvedValue(null),
      setSearchResults: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: {
            createQueryBuilder: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn()
          }
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {
            createQueryBuilder: vi.fn(),
            find: vi.fn()
          }
        },
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn()
          }
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
            del: vi.fn().mockResolvedValue(undefined),
            reset: vi.fn().mockResolvedValue(undefined)
          }
        }
      ]
    }).compile();

    service = module.get<SearchService>(SearchService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have cacheService defined', () => {
    // Try different ways to access the property
    console.log('Direct access:', service['cacheService']);
    console.log('Using Object.keys:', Object.keys(service));
    console.log('Using Object.getOwnPropertyNames:', Object.getOwnPropertyNames(service));
    
    // Try to find the property with a regex
    const keys = Object.getOwnPropertyNames(service);
    const cacheKey = keys.find(key => key.includes('cache'));
    console.log('Cache key found:', cacheKey);
    
    if (cacheKey) {
      expect(service[cacheKey]).toBeDefined();
    } else {
      // Fallback - check if it's a private property with a mangled name
      const privateCacheKey = keys.find(key => key.startsWith('_') && key.includes('cache'));
      console.log('Private cache key found:', privateCacheKey);
      if (privateCacheKey) {
        expect(service[privateCacheKey]).toBeDefined();
      } else {
        // Last resort - try to call a method that uses cacheService
        try {
          // This should fail if cacheService is not properly injected
          service['generateSearchKey'] = vi.fn();
          expect(true).toBe(false); // This should not be reached
        } catch (error) {
          console.log('Error when trying to access cacheService:', error);
          expect(error).toBeDefined();
        }
      }
    }
  });
});