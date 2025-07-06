import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
export declare class CacheOptimizationService {
    private cacheManager;
    private configService;
    private readonly logger;
    private readonly config;
    private readonly redis;
    constructor(cacheManager: Cache, configService: ConfigService);
    get<T>(key: string, fallback?: () => Promise<T>, ttl?: number, prefix?: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number, prefix?: string): Promise<void>;
    del(key: string, prefix?: string): Promise<void>;
    mset(items: Array<{
        key: string;
        value: any;
        ttl?: number;
        prefix?: string;
    }>): Promise<void>;
    mget<T>(keys: Array<{
        key: string;
        prefix?: string;
    }>): Promise<Record<string, T | null>>;
    invalidatePattern(pattern: string): Promise<number>;
    warmCache(warmingStrategy: Array<{
        key: string;
        loader: () => Promise<any>;
        ttl?: number;
        prefix?: string;
    }>): Promise<void>;
    getCacheStats(): Promise<{
        memory: any;
        keys: number;
        hitRate: number;
        keysByPrefix: Record<string, number>;
    }>;
    cleanup(): Promise<{
        deletedKeys: number;
        freedMemory: number;
    }>;
    private parseMemoryInfo;
    private getUsedMemoryBytes;
    smartPreload(accessPatterns: Array<{
        keyPattern: string;
        loader: (key: string) => Promise<any>;
        priority: number;
    }>): Promise<void>;
    private buildKey;
    private getDefaultTTL;
    private calculateHitRate;
    private getKeyAge;
}
