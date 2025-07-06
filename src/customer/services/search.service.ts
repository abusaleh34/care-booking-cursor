import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceCategory } from '../../database/entities/service-category.entity';
import { SearchProvidersDto, SortBy, SortOrder } from '../dto/search-providers.dto';
import { CacheService } from '../../cache/cache.service';

export interface SearchResult {
  providers: ServiceProviderResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ServiceProviderResult {
  id: string;
  businessName: string;
  businessDescription: string;
  businessAddress: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  distance?: number;
  services: ServiceResult[];
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface ServiceResult {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isHomeService: boolean;
  category: {
    id: string;
    name: string;
    iconUrl: string;
  } | null;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(ServiceProvider)
    private readonly serviceProviderRepository: Repository<ServiceProvider>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly serviceCategoryRepository: Repository<ServiceCategory>,
    private readonly cacheService: CacheService,
  ) {}

  async searchProviders(searchDto: SearchProvidersDto): Promise<SearchResult> {
    // Generate cache key
    const cacheKey = this.cacheService.generateSearchKey(searchDto);

    // Try to get from cache first
    const cachedResults = await this.cacheService.getSearchResults(cacheKey);
    if (cachedResults) {
      this.logger.debug('Returning cached search results');
      return cachedResults;
    }

    try {
      const query = this.buildSearchQuery(searchDto);

      // Get total count
      const total = await query.getCount();

      // Apply pagination
      query.skip(searchDto.offset || 0).take(searchDto.limit || 20);

      // Execute query
      const providers = await query.getMany();

      // Transform results
      const results = await this.transformProviderResults(providers, searchDto);

      // Cache the results (5 minutes TTL for search results)
      await this.cacheService.setSearchResults(cacheKey, results, 300);

      return {
        providers: results,
        total,
        page: Math.floor((searchDto.offset || 0) / (searchDto.limit || 20)) + 1,
        limit: searchDto.limit || 20,
        hasMore: (searchDto.offset || 0) + (searchDto.limit || 20) < total,
      };
    } catch (error) {
      this.logger.error('Error searching providers:', error);
      throw error;
    }
  }

  async getProviderDetails(
    providerId: string,
    latitude?: number,
    longitude?: number,
  ): Promise<ServiceProviderResult | null> {
    // Try cache first
    const cacheKey = `${providerId}_${latitude || 'no'}_${longitude || 'no'}`;
    const cachedProvider = await this.cacheService.getProvider(cacheKey);
    if (cachedProvider) {
      this.logger.debug(`Returning cached provider details for ${providerId}`);
      return cachedProvider;
    }

    try {
      const provider = await this.serviceProviderRepository.findOne({
        where: { id: providerId, isActive: true },
        relations: ['user', 'user.profile', 'services', 'services.category'],
      });

      if (!provider) {
        return null;
      }

      const result = this.transformSingleProviderResult(provider, latitude, longitude);

      // Cache provider details (10 minutes TTL)
      await this.cacheService.setProvider(cacheKey, result, 600);

      return result;
    } catch (error) {
      this.logger.error(`Error getting provider details for ${providerId}:`, error);
      throw error;
    }
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return this.serviceCategoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getCategories(): Promise<any[]> {
    // Try cache first
    const cachedCategories = await this.cacheService.getCategories();
    if (cachedCategories) {
      this.logger.debug('Returning cached categories');
      return cachedCategories;
    }

    // If not in cache, fetch from database
    const categories = await this.serviceCategoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.services', 'services')
      .addSelect('COUNT(DISTINCT services.id)', 'serviceCount')
      .where('category.isActive = :isActive', { isActive: true })
      .groupBy('category.id')
      .orderBy('category.name', 'ASC')
      .getRawAndEntities();

    const results = categories.entities.map((category, index) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      iconUrl: category.iconUrl,
      serviceCount: parseInt(categories.raw[index].serviceCount) || 0,
    }));

    // Cache categories (1 hour TTL)
    await this.cacheService.setCategories(results, 3600);

    return results;
  }

  private buildSearchQuery(searchDto: SearchProvidersDto): SelectQueryBuilder<ServiceProvider> {
    const query = this.serviceProviderRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.services', 'service', 'service.isActive = :serviceActive', {
        serviceActive: true,
      })
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('provider.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('provider.isActive = :active', { active: true });

    // Text search
    if (searchDto.query) {
      query.andWhere(
        '(provider.businessName ILIKE :query OR provider.businessDescription ILIKE :query OR service.name ILIKE :query)',
        { query: `%${searchDto.query}%` },
      );
    }

    // Category filter
    if (searchDto.categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId: searchDto.categoryId });
    }

    // Rating filter
    if (searchDto.minRating) {
      query.andWhere('provider.averageRating >= :minRating', { minRating: searchDto.minRating });
    }

    // Price range filter
    if (searchDto.minPrice) {
      query.andWhere('service.price >= :minPrice', { minPrice: searchDto.minPrice });
    }
    if (searchDto.maxPrice) {
      query.andWhere('service.price <= :maxPrice', { maxPrice: searchDto.maxPrice });
    }

    // Home service filter
    if (searchDto.isHomeService !== undefined) {
      query.andWhere('service.isHomeService = :isHomeService', {
        isHomeService: searchDto.isHomeService,
      });
    }

    // Verified providers only
    if (searchDto.verifiedOnly) {
      query.andWhere('provider.isVerified = :verified', { verified: true });
    }

    // Specific services filter
    if (searchDto.serviceIds && searchDto.serviceIds.length > 0) {
      query.andWhere('service.id IN (:...serviceIds)', { serviceIds: searchDto.serviceIds });
    }

    // Location-based filtering
    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(provider.latitude)) * cos(radians(provider.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(provider.latitude)))) <= :radius`,
        {
          lat: searchDto.latitude,
          lng: searchDto.longitude,
          radius: searchDto.radius,
        },
      );
    }

    // Sorting
    this.applySorting(query, searchDto);

    return query;
  }

  private applySorting(
    query: SelectQueryBuilder<ServiceProvider>,
    searchDto: SearchProvidersDto,
  ): void {
    const sortOrder = searchDto.sortOrder === SortOrder.DESC ? 'DESC' : 'ASC';

    switch (searchDto.sortBy) {
      case SortBy.RATING:
        query.orderBy('provider.averageRating', sortOrder);
        break;
      case SortBy.REVIEWS:
        query.orderBy('provider.totalReviews', sortOrder);
        break;
      case SortBy.PRICE:
        query.orderBy('service.price', sortOrder);
        break;
      case SortBy.NEWEST:
        query.orderBy('provider.createdAt', sortOrder);
        break;
      case SortBy.DISTANCE:
      default:
        if (searchDto.latitude && searchDto.longitude) {
          query.orderBy(
            `(6371 * acos(cos(radians(${searchDto.latitude})) * cos(radians(provider.latitude)) * cos(radians(provider.longitude) - radians(${searchDto.longitude})) + sin(radians(${searchDto.latitude})) * sin(radians(provider.latitude))))`,
            sortOrder,
          );
        } else {
          query.orderBy('provider.averageRating', 'DESC');
        }
        break;
    }

    // Secondary sort by rating
    if (searchDto.sortBy !== SortBy.RATING) {
      query.addOrderBy('provider.averageRating', 'DESC');
    }
  }

  private async transformProviderResults(
    providers: ServiceProvider[],
    searchDto: SearchProvidersDto,
  ): Promise<ServiceProviderResult[]> {
    return providers.map((provider) =>
      this.transformSingleProviderResult(provider, searchDto.latitude, searchDto.longitude),
    );
  }

  private transformSingleProviderResult(
    provider: ServiceProvider,
    latitude?: number,
    longitude?: number,
  ): ServiceProviderResult {
    const distance =
      latitude && longitude && provider.latitude && provider.longitude
        ? this.calculateDistance(latitude, longitude, provider.latitude, provider.longitude)
        : undefined;

    return {
      id: provider.id,
      businessName: provider.businessName,
      businessDescription: provider.businessDescription,
      businessAddress: provider.businessAddress,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      isVerified: provider.isVerified,
      distance,
      location:
        provider.latitude && provider.longitude
          ? {
              latitude: provider.latitude,
              longitude: provider.longitude,
            }
          : null,
      services:
        provider.services?.map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          isHomeService: service.isHomeService,
          category: service.category
            ? {
                id: service.category.id,
                name: service.category.name,
                iconUrl: service.category.iconUrl,
              }
            : null,
        })) || [],
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Cache invalidation methods for admin operations
  async invalidateProviderCache(providerId: string): Promise<void> {
    await this.cacheService.invalidateProvider(providerId);
    // Also invalidate search cache (this is simplified - in production you'd be more selective)
    this.logger.debug(`Invalidated caches for provider ${providerId}`);
  }

  async invalidateCategoriesCache(): Promise<void> {
    await this.cacheService.invalidateCategories();
    this.logger.debug('Invalidated categories cache');
  }
}
