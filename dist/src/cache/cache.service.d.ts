import { Cache } from 'cache-manager';
export interface CacheKeyOptions {
    ttl?: number;
    prefix?: string;
}
export declare class CacheService {
    private cacheManager;
    private readonly logger;
    constructor(cacheManager: Cache);
    getSearchResults(searchKey: string): Promise<any>;
    setSearchResults(searchKey: string, data: any, ttl?: number): Promise<void>;
    generateSearchKey(searchParams: any): string;
    getProvider(providerId: string): Promise<any>;
    setProvider(providerId: string, data: any, ttl?: number): Promise<void>;
    invalidateProvider(providerId: string): Promise<void>;
    getAvailability(providerId: string, serviceId: string, date: string): Promise<any>;
    setAvailability(providerId: string, serviceId: string, date: string, data: any, ttl?: number): Promise<void>;
    invalidateAvailability(providerId: string, date?: string): Promise<void>;
    getCategories(): Promise<any>;
    setCategories(data: any, ttl?: number): Promise<void>;
    invalidateCategories(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
    private deleteByPattern;
    warmupCache(): Promise<void>;
    getCacheStats(): Promise<any>;
}
