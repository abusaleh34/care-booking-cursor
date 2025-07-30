import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { SearchService } from '../../../src/customer/services/search.service';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceCategory } from '../../../src/database/entities/service-category.entity';

// Mock CacheService that doesn't depend on CACHE_MANAGER
class MockCacheService {
  generateSearchKey = vi.fn().mockReturnValue('test-search-key');
  getSearchResults = vi.fn().mockResolvedValue(null);
  setSearchResults = vi.fn().mockResolvedValue(undefined);
  get = vi.fn().mockResolvedValue(null);
  set = vi.fn().mockResolvedValue(undefined);
  del = vi.fn().mockResolvedValue(undefined);
}

describe('SearchService - Factory Provider Test', () => {
  let service: SearchService;
  let cacheService: MockCacheService;

  beforeEach(async () => {
    // Create an instance of the mock service
    cacheService = new MockCacheService();
    
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
          provide: 'CacheService',
          useFactory: () => cacheService
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have cacheService defined', () => {
    expect(service['cacheService']).toBeDefined();
  });

  it('should call cacheService.generateSearchKey', async () => {
    // Create a minimal search DTO
    const searchDto = {
      query: 'test',
      limit: 10,
      offset: 0
    };

    // Mock the buildSearchQuery method to avoid database calls
    service['buildSearchQuery'] = vi.fn().mockReturnValue({
      getCount: vi.fn().mockResolvedValue(0),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([])
    });

    // Mock the transformProviderResults method
    service['transformProviderResults'] = vi.fn().mockResolvedValue([]);

    try {
      // This should call cacheService.generateSearchKey
      await service['searchProviders'](searchDto);
      // If we get here, the cacheService was properly injected
      expect(cacheService.generateSearchKey).toHaveBeenCalledWith(searchDto);
    } catch (error) {
      console.log('Error in searchProviders:', error);
      // Re-throw the error so we can see what's happening
      throw error;
    }
  });
});