import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceCategory } from '../../../src/database/entities/service-category.entity';
import { SearchService } from '../../../src/customer/services/search.service';
import { CacheService } from '../../../src/cache/cache.service';

describe('Customer Search Service - Advanced Filters', () => {
  let service: SearchService;
  let serviceProviderRepository;
  let cacheService;

  const mockCategories = [
    { id: 'cat-1', name: 'Beauty & Wellness', icon: 'beauty', isActive: true },
    { id: 'cat-2', name: 'Massage Therapy', icon: 'massage', isActive: true },
    { id: 'cat-3', name: 'Hair & Styling', icon: 'hair', isActive: true },
  ];

  const mockProviders = [
    {
      id: 'provider-1',
      businessName: 'Sarah\'s Wellness Studio',
      businessDescription: 'Professional beauty and wellness services',
      businessAddress: '123 Main St, San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      averageRating: 4.8,
      totalReviews: 125,
      isVerified: true,
      isActive: true,
      services: [
        {
          id: 'service-1',
          name: 'Full Body Facial',
          description: 'Rejuvenating facial treatment',
          price: 120,
          duration: 90,
          category: mockCategories[0],
        },
        {
          id: 'service-2',
          name: 'Aromatherapy Session',
          description: 'Relaxing aromatherapy',
          price: 85,
          duration: 60,
          category: mockCategories[0],
        },
      ],
    },
    {
      id: 'provider-2',
      businessName: 'Mike\'s Massage Therapy',
      businessDescription: 'Deep tissue and therapeutic massage',
      businessAddress: '456 Oak St, Oakland, CA',
      latitude: 37.8044,
      longitude: -122.2712,
      averageRating: 4.9,
      totalReviews: 200,
      isVerified: true,
      isActive: true,
      isHomeService: true,
      services: [
        {
          id: 'service-3',
          name: 'Deep Tissue Massage',
          description: 'Therapeutic deep tissue massage',
          price: 110,
          duration: 90,
          category: mockCategories[1],
        },
      ],
    },
    {
      id: 'provider-3',
      businessName: 'Luna Hair Studio',
      businessDescription: 'Modern hair styling and treatments',
      businessAddress: '789 Pine St, Berkeley, CA',
      latitude: 37.8715,
      longitude: -122.2730,
      averageRating: 4.5,
      totalReviews: 80,
      isVerified: false,
      isActive: true,
      services: [
        {
          id: 'service-4',
          name: 'Haircut & Style',
          description: 'Professional haircut and styling',
          price: 65,
          duration: 60,
          category: mockCategories[2],
        },
      ],
    },
  ];

  // Mock CacheService that doesn't depend on CACHE_MANAGER
class MockCacheService {
  generateSearchKey = vi.fn().mockReturnValue('test-search-key');
  getSearchResults = vi.fn().mockResolvedValue(null);
  setSearchResults = vi.fn().mockResolvedValue(undefined);
  get = vi.fn().mockResolvedValue(null);
  set = vi.fn().mockResolvedValue(undefined);
  del = vi.fn().mockResolvedValue(undefined);
}

// ... later in the file ...

beforeEach(async () => {
    const mockServiceProviderRepository = {
      createQueryBuilder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: mockServiceProviderRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ServiceCategory),
          useValue: {
            find: vi.fn().mockResolvedValue(mockCategories),
          },
        },
        {
          provide: 'CacheService',
          useClass: MockCacheService
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
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    serviceProviderRepository = module.get(getRepositoryToken(ServiceProvider));
    cacheService = module.get('CacheService');
  });

  describe('Text Search', () => {
    it('should search by business name', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[0]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        query: 'sarah wellness',
        limit: 10,
        offset: 0,
      });

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].businessName).toContain('Sarah');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('business_name ILIKE'),
        expect.any(Object)
      );
    });

    it('should search by service description', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[1]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        query: 'deep tissue',
        limit: 10,
        offset: 0,
      });

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].services[0].name).toContain('Deep Tissue');
    });
  });

  describe('Category Filter', () => {
    it('should filter by category ID', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[0]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        categoryId: 'cat-1',
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.categoryId = :categoryId',
        { categoryId: 'cat-1' }
      );
    });

    it('should return empty results for invalid category', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        categoryId: 'invalid-category',
        limit: 10,
        offset: 0,
      });

      expect(result.providers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Location-based Search', () => {
    it('should filter by radius from location', async () => {
      const userLat = 37.7749; // San Francisco
      const userLng = -122.4194;
      const radius = 10; // 10 km

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockImplementation(() => {
                     // Filter providers by distance
          const filtered = mockProviders.filter(p => {
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (p.latitude - userLat) * Math.PI / 180;
            const dLon = (p.longitude - userLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(userLat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            return distance <= radius;
          });
          return Promise.resolve([filtered, filtered.length]);
        }),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        latitude: userLat,
        longitude: userLng,
        radius,
        limit: 10,
        offset: 0,
      });

      expect(result.providers.length).toBeGreaterThan(0);
      result.providers.forEach(provider => {
        expect(provider.distance).toBeDefined();
        expect(provider.distance).toBeLessThanOrEqual(radius);
      });
    });

    it('should sort by distance when location is provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders, mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

             await service.searchProviders({
        latitude: 37.7749,
        longitude: -122.4194,
        sortBy: 'distance' as any,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        expect.stringContaining('distance'),
        'ASC'
      );
    });
  });

  describe('Price Range Filter', () => {
    it('should filter by minimum price', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue(
          [[mockProviders[0], mockProviders[1]], 2]
        ),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        minPrice: 80,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price >= :minPrice',
        { minPrice: 80 }
      );
    });

    it('should filter by maximum price', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[2]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        maxPrice: 70,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price <= :maxPrice',
        { maxPrice: 70 }
      );
    });

    it('should filter by price range', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[0]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      await service.searchProviders({
        minPrice: 80,
        maxPrice: 130,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price >= :minPrice',
        { minPrice: 80 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price <= :maxPrice',
        { maxPrice: 130 }
      );
    });
  });

  describe('Rating Filter', () => {
    it('should filter by minimum rating', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue(
          [[mockProviders[0], mockProviders[1]], 2]
        ),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        minRating: 4.7,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.averageRating >= :minRating',
        { minRating: 4.7 }
      );
      result.providers.forEach(provider => {
        expect(provider.averageRating).toBeGreaterThanOrEqual(4.7);
      });
    });
  });

  describe('Service Type Filters', () => {
    it('should filter home service providers', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[1]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        isHomeService: true,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.isHomeService = :isHomeService',
        { isHomeService: true }
      );
      expect(result.providers[0].isHomeService).toBe(true);
    });

    it('should filter verified providers only', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue(
          [[mockProviders[0], mockProviders[1]], 2]
        ),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        verifiedOnly: true,
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.isVerified = :isVerified',
        { isVerified: true }
      );
      result.providers.forEach(provider => {
        expect(provider.isVerified).toBe(true);
      });
    });
  });

  describe('Sorting Options', () => {
    it('should sort by rating descending', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders, mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      await service.searchProviders({
        sortBy: 'rating',
        sortOrder: 'desc',
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'provider.averageRating',
        'DESC'
      );
    });

    it('should sort by price ascending', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders, mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      await service.searchProviders({
        sortBy: 'price',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'MIN(services.price)',
        'ASC'
      );
    });

    it('should sort by total reviews', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders, mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      await service.searchProviders({
        sortBy: 'reviews',
        sortOrder: 'desc',
        limit: 10,
        offset: 0,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'provider.totalReviews',
        'DESC'
      );
    });
  });

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders.slice(1, 3), mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        limit: 2,
        offset: 1,
      });

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(2);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(1);
      expect(result.providers).toHaveLength(2);
      expect(result.total).toBe(mockProviders.length);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(1);
    });

    it('should calculate hasMore correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders.slice(0, 2), 5]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        limit: 2,
        offset: 0,
      });

      expect(result.hasMore).toBe(true); // offset (0) + limit (2) < total (5)
    });
  });

  describe('Caching', () => {
    it('should return cached results if available', async () => {
      const cachedData = {
        providers: mockProviders,
        total: mockProviders.length,
        limit: 10,
        offset: 0,
        hasMore: false,
      };

      cacheService.get.mockResolvedValue(cachedData);

      const result = await service.searchProviders({
        categoryId: 'cat-1',
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual(cachedData);
      expect(serviceProviderRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should cache search results', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([mockProviders, mockProviders.length]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const result = await service.searchProviders({
        categoryId: 'cat-1',
        limit: 10,
        offset: 0,
      });

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String), // Cache key
        result,
        300 // 5 minutes TTL
      );
    });
  });

  describe('Complex Combined Filters', () => {
    it('should handle multiple filters simultaneously', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockProviders[0]], 1]),
      };

      serviceProviderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      cacheService.get.mockResolvedValue(null);

      const searchParams = {
        query: 'wellness',
        categoryId: 'cat-1',
        minPrice: 50,
        maxPrice: 150,
        minRating: 4.5,
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 20,
        verifiedOnly: true,
        sortBy: 'rating',
        sortOrder: 'desc' as const,
        limit: 10,
        offset: 0,
      };

      await service.searchProviders(searchParams);

      // Verify all filters were applied
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.categoryId = :categoryId',
        { categoryId: 'cat-1' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price >= :minPrice',
        { minPrice: 50 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'services.price <= :maxPrice',
        { maxPrice: 150 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.averageRating >= :minRating',
        { minRating: 4.5 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'provider.isVerified = :isVerified',
        { isVerified: true }
      );
    });
  });
}); 