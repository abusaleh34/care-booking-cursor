import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceCategory } from '../../../src/database/entities/service-category.entity';
import { SearchService } from '../../../src/customer/services/search.service';

// Mock repository class
class MockRepository<T> implements Partial<Repository<T>> {
  createQueryBuilder = vi.fn();
  find = vi.fn();
  findOne = vi.fn();
}

// Mock CacheService
class MockCacheService {
  generateSearchKey = vi.fn().mockReturnValue('test-search-key');
  getSearchResults = vi.fn().mockResolvedValue(null);
  setSearchResults = vi.fn().mockResolvedValue(undefined);
  get = vi.fn().mockResolvedValue(null);
  set = vi.fn().mockResolvedValue(undefined);
  del = vi.fn().mockResolvedValue(undefined);
}

describe('SearchService - Direct Instantiation', () => {
  let service: SearchService;
  let serviceProviderRepository: MockRepository<ServiceProvider>;
  let serviceRepository: MockRepository<Service>;
  let serviceCategoryRepository: MockRepository<ServiceCategory>;
  let cacheService: MockCacheService;

  beforeEach(() => {
    serviceProviderRepository = new MockRepository<ServiceProvider>();
    serviceRepository = new MockRepository<Service>();
    serviceCategoryRepository = new MockRepository<ServiceCategory>();
    cacheService = new MockCacheService();
    
    // Directly instantiate the service
    service = new SearchService(
      serviceProviderRepository as any,
      serviceRepository as any,
      serviceCategoryRepository as any,
      cacheService
    );
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