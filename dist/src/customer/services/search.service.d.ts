import { Repository } from 'typeorm';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceCategory } from '../../database/entities/service-category.entity';
import { SearchProvidersDto } from '../dto/search-providers.dto';
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
export declare class SearchService {
    private readonly serviceProviderRepository;
    private readonly serviceRepository;
    private readonly serviceCategoryRepository;
    private readonly cacheService;
    private readonly logger;
    constructor(serviceProviderRepository: Repository<ServiceProvider>, serviceRepository: Repository<Service>, serviceCategoryRepository: Repository<ServiceCategory>, cacheService: CacheService);
    searchProviders(searchDto: SearchProvidersDto): Promise<SearchResult>;
    getProviderDetails(providerId: string, latitude?: number, longitude?: number): Promise<ServiceProviderResult | null>;
    getServiceCategories(): Promise<ServiceCategory[]>;
    getCategories(): Promise<any[]>;
    private buildSearchQuery;
    private applySorting;
    private transformProviderResults;
    private transformSingleProviderResult;
    private calculateDistance;
    private toRadians;
    invalidateProviderCache(providerId: string): Promise<void>;
    invalidateCategoriesCache(): Promise<void>;
}
