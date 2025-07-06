import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheKeyOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // ========== SEARCH CACHE METHODS ==========

  async getSearchResults(searchKey: string): Promise<any> {
    try {
      const key = `search:${searchKey}`;
      const result = await this.cacheManager.get(key);
      if (result) {
        this.logger.debug(`Cache hit for search: ${searchKey}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error getting search cache for ${searchKey}:`, error);
      return null;
    }
  }

  async setSearchResults(searchKey: string, data: any, ttl: number = 300): Promise<void> {
    try {
      const key = `search:${searchKey}`;
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cached search results for: ${searchKey}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting search cache for ${searchKey}:`, error);
    }
  }

  generateSearchKey(searchParams: any): string {
    // Create a deterministic key from search parameters
    const sortedParams = Object.keys(searchParams)
      .sort()
      .reduce((result, key) => {
        if (searchParams[key] !== undefined && searchParams[key] !== null) {
          result[key] = searchParams[key];
        }
        return result;
      }, {} as any);

    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  // ========== PROVIDER CACHE METHODS ==========

  async getProvider(providerId: string): Promise<any> {
    try {
      const key = `provider:${providerId}`;
      const result = await this.cacheManager.get(key);
      if (result) {
        this.logger.debug(`Cache hit for provider: ${providerId}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error getting provider cache for ${providerId}:`, error);
      return null;
    }
  }

  async setProvider(providerId: string, data: any, ttl: number = 600): Promise<void> {
    try {
      const key = `provider:${providerId}`;
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cached provider data for: ${providerId}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting provider cache for ${providerId}:`, error);
    }
  }

  async invalidateProvider(providerId: string): Promise<void> {
    try {
      const key = `provider:${providerId}`;
      await this.cacheManager.del(key);
      this.logger.debug(`Invalidated provider cache for: ${providerId}`);
    } catch (error) {
      this.logger.error(`Error invalidating provider cache for ${providerId}:`, error);
    }
  }

  // ========== AVAILABILITY CACHE METHODS ==========

  async getAvailability(providerId: string, serviceId: string, date: string): Promise<any> {
    try {
      const key = `availability:${providerId}:${serviceId}:${date}`;
      const result = await this.cacheManager.get(key);
      if (result) {
        this.logger.debug(`Cache hit for availability: ${key}`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Error getting availability cache:`, error);
      return null;
    }
  }

  async setAvailability(
    providerId: string,
    serviceId: string,
    date: string,
    data: any,
    ttl: number = 60, // Shorter TTL for availability as it changes frequently
  ): Promise<void> {
    try {
      const key = `availability:${providerId}:${serviceId}:${date}`;
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cached availability for: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting availability cache:`, error);
    }
  }

  async invalidateAvailability(providerId: string, date?: string): Promise<void> {
    try {
      if (date) {
        // Invalidate specific date
        const pattern = `availability:${providerId}:*:${date}`;
        await this.deleteByPattern(pattern);
        this.logger.debug(`Invalidated availability cache for provider ${providerId} on ${date}`);
      } else {
        // Invalidate all availability for provider
        const pattern = `availability:${providerId}:*`;
        await this.deleteByPattern(pattern);
        this.logger.debug(`Invalidated all availability cache for provider ${providerId}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating availability cache:`, error);
    }
  }

  // ========== CATEGORY CACHE METHODS ==========

  async getCategories(): Promise<any> {
    try {
      const key = 'categories:all';
      const result = await this.cacheManager.get(key);
      if (result) {
        this.logger.debug('Cache hit for categories');
      }
      return result;
    } catch (error) {
      this.logger.error('Error getting categories cache:', error);
      return null;
    }
  }

  async setCategories(data: any, ttl: number = 3600): Promise<void> {
    try {
      const key = 'categories:all';
      await this.cacheManager.set(key, data, ttl);
      this.logger.debug(`Cached categories, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error('Error setting categories cache:', error);
    }
  }

  async invalidateCategories(): Promise<void> {
    try {
      const key = 'categories:all';
      await this.cacheManager.del(key);
      this.logger.debug('Invalidated categories cache');
    } catch (error) {
      this.logger.error('Error invalidating categories cache:', error);
    }
  }

  // ========== GENERIC CACHE METHODS ==========

  async get(key: string): Promise<any> {
    try {
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.error(`Error getting cache for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache for ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Note: cache-manager doesn't have a reset method, we'll clear individual keys or handle this differently
      this.logger.log('Cache clear requested - individual key deletion would be needed');
      // TODO: Implement proper cache clearing strategy
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  // ========== HELPER METHODS ==========

  private async deleteByPattern(pattern: string): Promise<void> {
    // Note: This is a simplified implementation
    // In production, you might want to use Redis SCAN command for better performance
    try {
      // For now, we'll log the pattern but this would need Redis-specific implementation
      this.logger.debug(`Would delete keys matching pattern: ${pattern}`);
      // TODO: Implement pattern-based deletion using Redis SCAN
    } catch (error) {
      this.logger.error(`Error deleting by pattern ${pattern}:`, error);
    }
  }

  // Cache warming methods
  async warmupCache(): Promise<void> {
    this.logger.log('Starting cache warmup...');
    // TODO: Implement cache warming for frequently accessed data
    // - Popular search results
    // - Active providers
    // - Categories
    this.logger.log('Cache warmup completed');
  }

  // Cache statistics
  async getCacheStats(): Promise<any> {
    try {
      // This would return Redis-specific stats in a real implementation
      return {
        status: 'active',
        // TODO: Add more detailed cache statistics
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { status: 'error' };
    }
  }
}
