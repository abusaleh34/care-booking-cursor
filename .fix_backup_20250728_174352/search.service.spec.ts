import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SearchService } from '../../../src/customer/services/search.service';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceCategory } from '../../../src/database/entities/service-category.entity';
import { CacheService } from '../../../src/cache/cache.service';
import { SearchProvidersDto, SortBy, SortOrder } from '../../../src/customer/dto/search-providers.dto';

describe('SearchService', () => {
  let service: SearchService;
  let serviceProviderRepository: Repository<ServiceProvider>;
  let serviceRepository: Repository<Service>;
  let serviceCategoryRepository: Repository<ServiceCategory>;
  let cacheService: CacheService;

  const mockServiceCategory = {
    id: 'category-123',
    name: 'Beauty & Wellness',
    iconUrl: 'https://example.com/beauty-icon.png'
  };

  const mockService = {
    id: 'service-123',
    name: 'Full Body Massage',
    description: 'Relaxing full body massage',
    price: 150,
    durationMinutes: 60,
    isHomeService: true,
    category: mockServiceCategory
  };

  const mockServiceProvider = {
    id: 'provider-123',
    businessName: 'Serenity Spa',
    businessDescription: 'Premium spa services',
    businessAddress: '123 Main St, City, State 12345',
    averageRating: 4.5,
    totalReviews: 125,
    isVerified: true,
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    services: [mockService]
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getCount: vi.fn().mockResolvedValue(1),
    getMany: vi.fn().mockResolvedValue([mockServiceProvider])
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: {
            createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
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
          useValue: {
            generateSearchKey: vi.fn(),
            getSearchResults: vi.fn(),
            setSearchResults: vi.fn()
          }
        }
      ]
    }).compile();

    service = module.get<SearchService>(SearchService);
    serviceProviderRepository = module.get(getRepositoryToken(ServiceProvider));
    serviceRepository = module.get(getRepositoryToken(Service));
    serviceCategoryRepository = module.get(getRepositoryToken(ServiceCategory));
    cacheService = module.get(CacheService);

    vi.clearAllMocks();
  });

  describe('searchProviders', () => {
    it('should return cached results when available', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage',
        location: 'New York',
        limit: 20,
        offset: 0
      };

      const cachedResults = {
        providers: [{
          id: 'provider-123',
          businessName: 'Serenity Spa',
          businessDescription: 'Premium spa services',
          businessAddress: '123 Main St, City, State 12345',
          averageRating: 4.5,
          totalReviews: 125,
          isVerified: true,
          distance: 2.5,
          services: [{
            id: 'service-123',
            name: 'Full Body Massage',
            description: 'Relaxing full body massage',
            price: 150,
            durationMinutes: 60,
            isHomeService: true,
            category: {
              id: 'category-123',
              name: 'Beauty & Wellness',
              iconUrl: 'https://example.com/beauty-icon.png'
            }
          }],
          location: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(cachedResults);

      const result = await service.searchProviders(searchDto);

      expect(result).toEqual(cachedResults);
      expect(cacheService.getSearchResults).toHaveBeenCalledWith('search:key123');
      expect(mockQueryBuilder.getMany).not.toHaveBeenCalled();
    });

    it('should search providers when no cache available', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage',
        location: 'New York',
        limit: 20,
        offset: 0
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);

      // Mock the buildSearchQuery and transformProviderResults methods
      const transformedResults = [{
        id: 'provider-123',
        businessName: 'Serenity Spa',
        businessDescription: 'Premium spa services',
        businessAddress: '123 Main St, City, State 12345',
        averageRating: 4.5,
        totalReviews: 125,
        isVerified: true,
        distance: undefined,
        services: [{
          id: 'service-123',
          name: 'Full Body Massage',
          description: 'Relaxing full body massage',
          price: 150,
          durationMinutes: 60,
          isHomeService: true,
          category: {
            id: 'category-123',
            name: 'Beauty & Wellness',
            iconUrl: 'https://example.com/beauty-icon.png'
          }
        }],
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }];

      vi.spyOn(service as any, 'transformProviderResults').mockResolvedValue(transformedResults);

      const result = await service.searchProviders(searchDto);

      expect(result).toEqual({
        providers: transformedResults,
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false
      });

      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(cacheService.setSearchResults).toHaveBeenCalledWith('search:key123', transformedResults, 300);
    });

    it('should handle pagination correctly', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage',
        limit: 10,
        offset: 20
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);
      vi.mocked(mockQueryBuilder.getCount).mockResolvedValue(50);
      vi.spyOn(service as any, 'transformProviderResults').mockResolvedValue([]);

      const result = await service.searchProviders(searchDto);

      expect(result.page).toBe(3); // (20 / 10) + 1
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true); // 20 + 10 < 50
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should use default pagination when not provided', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage'
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);
      vi.spyOn(service as any, 'transformProviderResults').mockResolvedValue([]);

      const result = await service.searchProviders(searchDto);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should handle search errors', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage'
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);
      vi.mocked(mockQueryBuilder.getCount).mockRejectedValue(new Error('Database error'));

      await expect(service.searchProviders(searchDto)).rejects.toThrow('Database error');
    });
  });

  describe('buildSearchQuery', () => {
    it('should build query with text search', () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage therapy',
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      const query = buildSearchQuery(searchDto);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('provider.services', 'service');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('service.category', 'category');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('provider.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('provider.businessName ILIKE :query'),
        expect.objectContaining({ query: '%massage therapy%' })
      );
    });

    it('should build query with category filter', () => {
      const searchDto: SearchProvidersDto = {
        categoryId: 'category-123',
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category.id = :categoryId', { categoryId: 'category-123' });
    });

    it('should build query with price range filter', () => {
      const searchDto: SearchProvidersDto = {
        minPrice: 50,
        maxPrice: 200,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('service.price >= :minPrice', { minPrice: 50 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('service.price <= :maxPrice', { maxPrice: 200 });
    });

    it('should build query with rating filter', () => {
      const searchDto: SearchProvidersDto = {
        minRating: 4.0,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('provider.averageRating >= :minRating', { minRating: 4.0 });
    });

    it('should build query with home service filter', () => {
      const searchDto: SearchProvidersDto = {
        isHomeService: true,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('service.isHomeService = :isHomeService', { isHomeService: true });
    });

    it('should build query with verified providers filter', () => {
      const searchDto: SearchProvidersDto = {
        isVerified: true,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('provider.isVerified = :isVerified', { isVerified: true });
    });

    it('should apply sorting by rating', () => {
      const searchDto: SearchProvidersDto = {
        sortBy: SortBy.RATING,
        sortOrder: SortOrder.DESC,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('provider.averageRating', 'DESC');
    });

    it('should apply sorting by price', () => {
      const searchDto: SearchProvidersDto = {
        sortBy: SortBy.PRICE,
        sortOrder: SortOrder.ASC,
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('service.price', 'ASC');
    });

    it('should apply default sorting', () => {
      const searchDto: SearchProvidersDto = {
        limit: 20,
        offset: 0
      };

      const buildSearchQuery = (service as any).buildSearchQuery.bind(service);
      buildSearchQuery(searchDto);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('provider.averageRating', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('provider.totalReviews', 'DESC');
    });
  });

  describe('transformProviderResults', () => {
    it('should transform provider results correctly', async () => {
      const providers = [mockServiceProvider];
      const searchDto: SearchProvidersDto = {
        query: 'massage',
        limit: 20,
        offset: 0
      };

      const transformProviderResults = (service as any).transformProviderResults.bind(service);
      const result = await transformProviderResults(providers, searchDto);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'provider-123',
        businessName: 'Serenity Spa',
        businessDescription: 'Premium spa services',
        businessAddress: '123 Main St, City, State 12345',
        averageRating: 4.5,
        totalReviews: 125,
        isVerified: true,
        distance: undefined,
        services: [{
          id: 'service-123',
          name: 'Full Body Massage',
          description: 'Relaxing full body massage',
          price: 150,
          durationMinutes: 60,
          isHomeService: true,
          category: {
            id: 'category-123',
            name: 'Beauty & Wellness',
            iconUrl: 'https://example.com/beauty-icon.png'
          }
        }],
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      });
    });

    it('should calculate distance when location is provided', async () => {
      const providers = [mockServiceProvider];
      const searchDto: SearchProvidersDto = {
        query: 'massage',
        latitude: 40.7589,
        longitude: -73.9851,
        limit: 20,
        offset: 0
      };

      const calculateDistance = vi.fn().mockReturnValue(5.2);
      vi.spyOn(service as any, 'calculateDistance').mockImplementation(calculateDistance);

      const transformProviderResults = (service as any).transformProviderResults.bind(service);
      const result = await transformProviderResults(providers, searchDto);

      expect(calculateDistance).toHaveBeenCalledWith(
        40.7589, -73.9851,
        40.7128, -74.0060
      );
      expect(result[0].distance).toBe(5.2);
    });

    it('should handle providers with no services', async () => {
      const providerWithoutServices = {
        ...mockServiceProvider,
        services: []
      };

      const transformProviderResults = (service as any).transformProviderResults.bind(service);
      const result = await transformProviderResults([providerWithoutServices], {});

      expect(result[0].services).toEqual([]);
    });

    it('should handle providers with no location', async () => {
      const providerWithoutLocation = {
        ...mockServiceProvider,
        location: null
      };

      const transformProviderResults = (service as any).transformProviderResults.bind(service);
      const result = await transformProviderResults([providerWithoutLocation], {});

      expect(result[0].location).toBeNull();
      expect(result[0].distance).toBeUndefined();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const calculateDistance = (service as any).calculateDistance.bind(service);
      
      // Distance between New York and Philadelphia (approximately 95 miles)
      const distance = calculateDistance(40.7128, -74.0060, 39.9526, -75.1652);
      
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(100);
    });

    it('should return 0 for same coordinates', () => {
      const calculateDistance = (service as any).calculateDistance.bind(service);
      
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      
      expect(distance).toBe(0);
    });
  });

  describe('getServiceCategories', () => {
    it('should return all service categories', async () => {
      const categories = [
        { id: 'cat-1', name: 'Beauty & Wellness', iconUrl: 'icon1.png' },
        { id: 'cat-2', name: 'Health & Fitness', iconUrl: 'icon2.png' }
      ];

      vi.mocked(serviceCategoryRepository.find).mockResolvedValue(categories as any);

      const result = await service.getServiceCategories();

      expect(result).toEqual(categories);
      expect(serviceCategoryRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' }
      });
    });

    it('should handle empty categories', async () => {
      vi.mocked(serviceCategoryRepository.find).mockResolvedValue([]);

      const result = await service.getServiceCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getPopularServices', () => {
    it('should return popular services', async () => {
      const mockPopularServices = [
        { ...mockService, id: 'service-1', name: 'Massage Therapy' },
        { ...mockService, id: 'service-2', name: 'Facial Treatment' }
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockPopularServices)
      };

      vi.mocked(serviceRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPopularServices(10);

      expect(result).toEqual(mockPopularServices);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('service.category', 'category');
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('service.id');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('COUNT(booking.id)', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should use default limit when not specified', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([])
      };

      vi.mocked(serviceRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      await service.getPopularServices();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      const query = 'mass';
      const suggestions = [
        { type: 'service', name: 'Massage Therapy' },
        { type: 'provider', name: 'Massage Masters' },
        { type: 'category', name: 'Massage & Bodywork' }
      ];

      vi.spyOn(service as any, 'getServiceSuggestions').mockResolvedValue([
        { type: 'service', name: 'Massage Therapy' }
      ]);
      vi.spyOn(service as any, 'getProviderSuggestions').mockResolvedValue([
        { type: 'provider', name: 'Massage Masters' }
      ]);
      vi.spyOn(service as any, 'getCategorySuggestions').mockResolvedValue([
        { type: 'category', name: 'Massage & Bodywork' }
      ]);

      const result = await service.getSuggestions(query, 10);

      expect(result).toEqual(suggestions);
    });

    it('should limit suggestions to specified count', async () => {
      const query = 'mass';
      const limit = 5;

      vi.spyOn(service as any, 'getServiceSuggestions').mockResolvedValue([
        { type: 'service', name: 'Service 1' },
        { type: 'service', name: 'Service 2' }
      ]);
      vi.spyOn(service as any, 'getProviderSuggestions').mockResolvedValue([
        { type: 'provider', name: 'Provider 1' },
        { type: 'provider', name: 'Provider 2' }
      ]);
      vi.spyOn(service as any, 'getCategorySuggestions').mockResolvedValue([
        { type: 'category', name: 'Category 1' },
        { type: 'category', name: 'Category 2' }
      ]);

      const result = await service.getSuggestions(query, limit);

      expect(result).toHaveLength(limit);
    });

    it('should handle empty query', async () => {
      const result = await service.getSuggestions('', 10);

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in search', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage'
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);
      vi.mocked(mockQueryBuilder.getCount).mockRejectedValue(new Error('Database connection failed'));

      await expect(service.searchProviders(searchDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle cache errors gracefully', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage'
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockRejectedValue(new Error('Cache error'));
      vi.spyOn(service as any, 'transformProviderResults').mockResolvedValue([]);

      // Should continue with search even if cache fails
      const result = await service.searchProviders(searchDto);

      expect(result).toBeDefined();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should handle transformation errors', async () => {
      const searchDto: SearchProvidersDto = {
        query: 'massage'
      };

      vi.mocked(cacheService.generateSearchKey).mockReturnValue('search:key123');
      vi.mocked(cacheService.getSearchResults).mockResolvedValue(null);
      vi.spyOn(service as any, 'transformProviderResults').mockRejectedValue(new Error('Transform error'));

      await expect(service.searchProviders(searchDto)).rejects.toThrow('Transform error');
    });
  });
});