import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis from 'ioredis';

@Injectable()
export class CacheOptimizationService {
  private readonly logger = new Logger(CacheOptimizationService.name);
  private readonly config: any;
  private readonly redis: Redis;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.config = this.configService.get('optimization');

    // Initialize Redis client for advanced operations
    this.redis = new Redis({
      ...this.config.cache.redis,
      lazyConnect: true,
    });
  }

  /**
   * Get cached data with automatic fallback and warming
   */
  async get<T>(
    key: string,
    fallback?: () => Promise<T>,
    ttl?: number,
    prefix?: string,
  ): Promise<T | null> {
    const fullKey = this.buildKey(key, prefix);

    try {
      const cached = await this.cacheManager.get<T>(fullKey);

      if (cached !== null && cached !== undefined) {
        this.logger.debug(`Cache hit: ${fullKey}`);
        return cached;
      }

      if (fallback) {
        this.logger.debug(`Cache miss: ${fullKey}, executing fallback`);
        const data = await fallback();

        if (data !== null && data !== undefined) {
          await this.set(key, data, ttl, prefix);
        }

        return data;
      }

      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${fullKey}:`, error);

      // If cache fails, try fallback if available
      if (fallback) {
        return await fallback();
      }

      return null;
    }
  }

  /**
   * Set cached data with intelligent TTL
   */
  async set<T>(key: string, value: T, ttl?: number, prefix?: string): Promise<void> {
    const fullKey = this.buildKey(key, prefix);
    const finalTtl = ttl || this.getDefaultTTL(prefix);

    try {
      await this.cacheManager.set(fullKey, value, finalTtl * 1000); // Convert to milliseconds
      this.logger.debug(`Cache set: ${fullKey} (TTL: ${finalTtl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${fullKey}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string, prefix?: string): Promise<void> {
    const fullKey = this.buildKey(key, prefix);

    try {
      await this.cacheManager.del(fullKey);
      this.logger.debug(`Cache deleted: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${fullKey}:`, error);
    }
  }

  /**
   * Cache multiple items with pipeline for efficiency
   */
  async mset(
    items: Array<{ key: string; value: any; ttl?: number; prefix?: string }>,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const item of items) {
      const fullKey = this.buildKey(item.key, item.prefix);
      const ttl = item.ttl || this.getDefaultTTL(item.prefix);

      pipeline.setex(fullKey, ttl, JSON.stringify(item.value));
    }

    try {
      await pipeline.exec();
      this.logger.debug(`Bulk cache set: ${items.length} items`);
    } catch (error) {
      this.logger.error('Bulk cache set error:', error);
    }
  }

  /**
   * Get multiple items efficiently
   */
  async mget<T>(keys: Array<{ key: string; prefix?: string }>): Promise<Record<string, T | null>> {
    const fullKeys = keys.map((k) => this.buildKey(k.key, k.prefix));
    const result: Record<string, T | null> = {};

    try {
      const values = await this.redis.mget(fullKeys);

      keys.forEach((keyInfo, index) => {
        const originalKey = keyInfo.key;
        const value = values[index];

        if (value) {
          try {
            result[originalKey] = JSON.parse(value);
          } catch {
            result[originalKey] = value as any;
          }
        } else {
          result[originalKey] = null;
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Bulk cache get error:', error);
      return Object.fromEntries(keys.map((k) => [k.key, null]));
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(keys);
      this.logger.debug(`Cache pattern invalidated: ${pattern} (${keys.length} keys)`);

      return keys.length;
    } catch (error) {
      this.logger.error(`Cache pattern invalidation error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache(
    warmingStrategy: Array<{
      key: string;
      loader: () => Promise<any>;
      ttl?: number;
      prefix?: string;
    }>,
  ): Promise<void> {
    this.logger.log(`Starting cache warming for ${warmingStrategy.length} keys`);

    const promises = warmingStrategy.map(async (strategy) => {
      try {
        const data = await strategy.loader();
        await this.set(strategy.key, data, strategy.ttl, strategy.prefix);
      } catch (error) {
        this.logger.error(`Cache warming failed for key ${strategy.key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    memory: any;
    keys: number;
    hitRate: number;
    keysByPrefix: Record<string, number>;
  }> {
    try {
      // Use info command instead of memory for compatibility
      const memoryInfo = await this.redis.info('memory');
      const keys = await this.redis.dbsize();

      // Get keys by prefix
      const prefixes = Object.values(this.config.cache.prefixes || {});
      const keysByPrefix: Record<string, number> = {};

      for (const prefix of prefixes) {
        const prefixKeys = await this.redis.keys(`${this.config.cache.redis.keyPrefix}${prefix}*`);
        keysByPrefix[String(prefix)] = prefixKeys.length;
      }

      return {
        memory: this.parseMemoryInfo(memoryInfo),
        keys: keys,
        hitRate: await this.calculateHitRate(),
        keysByPrefix,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        memory: {},
        keys: 0,
        hitRate: 0,
        keysByPrefix: {},
      };
    }
  }

  /**
   * Cache cleanup for expired or unused keys
   */
  async cleanup(): Promise<{
    deletedKeys: number;
    freedMemory: number;
  }> {
    let deletedKeys = 0;
    let freedMemory = 0;

    try {
      const memoryBefore = await this.getUsedMemoryBytes();

      // Get all keys with TTL information
      const keys = await this.redis.keys(`${this.config.cache.redis.keyPrefix}*`);
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        // Check if key is expired or has very low TTL
        const ttl = await this.redis.ttl(key);

        if (ttl === -1) {
          // Key has no expiration
          // Check if it's an old key that should expire
          const keyAge = await this.getKeyAge(key);
          if (keyAge > 86400) {
            // Older than 24 hours
            pipeline.del(key);
            deletedKeys++;
          }
        }
      }

      if (deletedKeys > 0) {
        await pipeline.exec();
        const memoryAfter = await this.getUsedMemoryBytes();
        freedMemory = memoryBefore - memoryAfter;

        this.logger.log(`Cache cleanup: deleted ${deletedKeys} keys, freed ${freedMemory} bytes`);
      }
    } catch (error) {
      this.logger.error('Cache cleanup error:', error);
    }

    return { deletedKeys, freedMemory };
  }

  /**
   * Parse memory info string into object
   */
  private parseMemoryInfo(info: string): any {
    const memoryData: any = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryData[key] = value;
      }
    }

    return memoryData;
  }

  /**
   * Get used memory in bytes
   */
  private async getUsedMemoryBytes(): Promise<number> {
    try {
      const info = await this.redis.info('memory');
      const lines = info.split('\r\n');

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          return parseInt(line.split(':')[1]);
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Smart cache preloading based on access patterns
   */
  async smartPreload(
    accessPatterns: Array<{
      keyPattern: string;
      loader: (key: string) => Promise<any>;
      priority: number;
    }>,
  ): Promise<void> {
    // Sort by priority
    accessPatterns.sort((a, b) => b.priority - a.priority);

    for (const pattern of accessPatterns) {
      try {
        const keys = await this.redis.keys(pattern.keyPattern);
        const loadPromises = keys.slice(0, 10).map(async (key) => {
          // Limit to top 10
          const data = await pattern.loader(key);
          await this.redis.set(key, JSON.stringify(data));
        });

        await Promise.allSettled(loadPromises);
      } catch (error) {
        this.logger.error(`Smart preload error for pattern ${pattern.keyPattern}:`, error);
      }
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    const keyPrefix = this.config.cache.redis.keyPrefix;
    const cachePrefix = prefix || '';
    return `${keyPrefix}${cachePrefix}${key}`;
  }

  /**
   * Get default TTL based on prefix/context
   */
  private getDefaultTTL(prefix?: string): number {
    const ttlMap = this.config.cache.ttl;

    switch (prefix) {
      case this.config.cache.prefixes.search:
        return ttlMap.searchResults;
      case this.config.cache.prefixes.provider:
        return ttlMap.providerProfiles;
      case this.config.cache.prefixes.category:
        return ttlMap.serviceCategories;
      case this.config.cache.prefixes.session:
        return ttlMap.userSessions;
      case this.config.cache.prefixes.availability:
        return ttlMap.availabilityData;
      case this.config.cache.prefixes.dashboard:
        return ttlMap.dashboardMetrics;
      case this.config.cache.prefixes.static:
        return ttlMap.staticContent;
      default:
        return ttlMap.searchResults; // Default fallback
    }
  }

  /**
   * Calculate cache hit rate
   */
  private async calculateHitRate(): Promise<number> {
    try {
      const info = await this.redis.info('stats');
      const lines = info.split('\r\n');

      let hits = 0;
      let misses = 0;

      for (const line of lines) {
        if (line.startsWith('keyspace_hits:')) {
          hits = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('keyspace_misses:')) {
          misses = parseInt(line.split(':')[1]);
        }
      }

      return hits + misses > 0 ? hits / (hits + misses) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get key age in seconds
   */
  private async getKeyAge(key: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In practice, you might store creation timestamps
      return 0;
    } catch {
      return 0;
    }
  }
}
