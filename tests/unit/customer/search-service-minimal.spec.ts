import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

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

describe('SearchService - Minimal Test', () => {
  let service: SearchService;
  let cacheService: MockCacheService;

  beforeEach(async () => {
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
          useClass: MockCacheService
        }
      ]
    }).compile();

    service = module.get<SearchService>(SearchService);
    cacheService = module.get<MockCacheService>('CacheService' as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have cacheService defined', () => {
    expect(service['cacheService']).toBeDefined();
  });
});