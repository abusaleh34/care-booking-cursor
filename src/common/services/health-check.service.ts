import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
    external: ComponentHealth;
    performance: ComponentHealth;
  };
  summary: {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    criticalChecks: number;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  metrics?: Record<string, any>;
  lastChecked: Date;
  responseTime?: number;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly config: any;
  private redis: Redis;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.config = this.configService.get('optimization');
    this.redis = new Redis({
      ...this.config.cache.redis,
      lazyConnect: true,
    });
  }

  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    this.logger.debug('Starting comprehensive health check');

    const [
      databaseHealth,
      redisHealth,
      memoryHealth,
      diskHealth,
      externalHealth,
      performanceHealth,
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkExternalServices(),
      this.checkPerformance(),
    ]);

    const checks = {
      database: this.resolveHealth(databaseHealth),
      redis: this.resolveHealth(redisHealth),
      memory: this.resolveHealth(memoryHealth),
      disk: this.resolveHealth(diskHealth),
      external: this.resolveHealth(externalHealth),
      performance: this.resolveHealth(performanceHealth),
    };

    const summary = this.calculateSummary(checks);
    const overallStatus = this.determineOverallStatus(checks);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      checks,
      summary,
    };

    const duration = Date.now() - startTime;
    this.logger.debug(`Health check completed in ${duration}ms - Status: ${overallStatus}`);

    return result;
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      await this.dataSource.query('SELECT 1');

      // Check connection pool
      const poolStats = this.getConnectionPoolStats();

      // Test query performance
      const queryStart = Date.now();
      await this.dataSource.query('SELECT COUNT(*) FROM users');
      const queryTime = Date.now() - queryStart;

      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let message = 'Database is healthy';

      if (queryTime > this.config.thresholds.databaseQuery.critical) {
        status = 'critical';
        message = `Database queries are critically slow (${queryTime}ms)`;
      } else if (queryTime > this.config.thresholds.databaseQuery.slow) {
        status = 'degraded';
        message = `Database queries are slow (${queryTime}ms)`;
      }

      return {
        status,
        message,
        metrics: {
          queryTime,
          connectionPool: poolStats,
          activeConnections: poolStats.used,
          maxConnections: poolStats.max,
        },
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Database connection failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Redis connectivity and performance
   */
  private async checkRedis(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      await this.redis.ping();

      // Test read/write operations
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await this.redis.set(testKey, testValue, 'EX', 60);
      const retrievedValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      if (retrievedValue !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      // Get Redis info
      const info = await this.redis.info();
      const memory = await this.redis.info('memory');

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Redis is healthy',
        metrics: {
          memory: this.parseRedisInfo(memory),
          connections: this.parseRedisConnections(info),
        },
        lastChecked: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Redis connection failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal;
      const usedMemory = usage.heapUsed;
      const freeMemory = totalMemory - usedMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let message = 'Memory usage is normal';

      if (memoryUsagePercent > 90) {
        status = 'critical';
        message = `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`;
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
        message = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`;
      }

      return {
        status,
        message,
        metrics: {
          heapUsed: this.formatBytes(usage.heapUsed),
          heapTotal: this.formatBytes(usage.heapTotal),
          external: this.formatBytes(usage.external),
          rss: this.formatBytes(usage.rss),
          usagePercent: memoryUsagePercent.toFixed(1) + '%',
        },
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Memory check failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDisk(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // This is a simplified implementation
      // In production, you'd want to use a library like 'node-df' or system calls
      const stats = await import('fs').then((fs) => fs.promises.stat('.').catch(() => null));

      if (!stats) {
        throw new Error('Unable to read disk statistics');
      }

      // Mock disk usage for demonstration
      const diskUsagePercent = Math.random() * 50; // 0-50% usage

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let message = 'Disk space is adequate';

      if (diskUsagePercent > 90) {
        status = 'critical';
        message = `Critical disk usage: ${diskUsagePercent.toFixed(1)}%`;
      } else if (diskUsagePercent > 80) {
        status = 'degraded';
        message = `High disk usage: ${diskUsagePercent.toFixed(1)}%`;
      }

      return {
        status,
        message,
        metrics: {
          usagePercent: diskUsagePercent.toFixed(1) + '%',
          available: '50GB', // Mock data
          total: '100GB', // Mock data
        },
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Disk check failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const checks = await Promise.allSettled([
        this.checkStripeConnection(),
        this.checkTwilioConnection(),
        this.checkEmailService(),
      ]);

      const results = checks.map((check, index) => ({
        service: ['Stripe', 'Twilio', 'Email'][index],
        success: check.status === 'fulfilled',
        error: check.status === 'rejected' ? (check as any).reason?.message : null,
      }));

      const failedServices = results.filter((r) => !r.success);

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let message = 'All external services are healthy';

      if (failedServices.length > 1) {
        status = 'critical';
        message = `Multiple external services failing: ${failedServices.map((s) => s.service).join(', ')}`;
      } else if (failedServices.length === 1) {
        status = 'degraded';
        message = `External service issue: ${failedServices[0].service}`;
      }

      return {
        status,
        message,
        metrics: {
          services: results,
          successfulServices: results.filter((r) => r.success).length,
          totalServices: results.length,
        },
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `External services check failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check system performance metrics
   */
  private async checkPerformance(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Simulate performance metrics
      const cpuUsage = process.cpuUsage();
      const loadAverage = process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0];

      // Mock API response times
      const apiResponseTimes = {
        p50: 120,
        p95: 280,
        p99: 450,
      };

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let message = 'Performance metrics are normal';

      if (apiResponseTimes.p95 > this.config.thresholds.apiResponseTime.p99) {
        status = 'critical';
        message = `Critical API response times: P95 ${apiResponseTimes.p95}ms`;
      } else if (apiResponseTimes.p95 > this.config.thresholds.apiResponseTime.p95) {
        status = 'degraded';
        message = `Elevated API response times: P95 ${apiResponseTimes.p95}ms`;
      }

      return {
        status,
        message,
        metrics: {
          apiResponseTimes,
          cpuUsage: {
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
          loadAverage: loadAverage.map((l) => l.toFixed(2)),
          uptime: process.uptime(),
        },
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Performance check failed: ${error.message}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get detailed system status for monitoring
   */
  async getDetailedStatus(): Promise<{
    system: any;
    database: any;
    cache: any;
    performance: any;
  }> {
    const [systemStatus, dbStatus, cacheStatus, perfStatus] = await Promise.allSettled([
      this.getSystemStatus(),
      this.getDatabaseStatus(),
      this.getCacheStatus(),
      this.getPerformanceStatus(),
    ]);

    return {
      system:
        systemStatus.status === 'fulfilled'
          ? systemStatus.value
          : { error: (systemStatus as any).reason?.message },
      database:
        dbStatus.status === 'fulfilled'
          ? dbStatus.value
          : { error: (dbStatus as any).reason?.message },
      cache:
        cacheStatus.status === 'fulfilled'
          ? cacheStatus.value
          : { error: (cacheStatus as any).reason?.message },
      performance:
        perfStatus.status === 'fulfilled'
          ? perfStatus.value
          : { error: (perfStatus as any).reason?.message },
    };
  }

  // Private helper methods

  private resolveHealth(settledResult: PromiseSettledResult<ComponentHealth>): ComponentHealth {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      return {
        status: 'critical',
        message: `Health check failed: ${settledResult.reason?.message || 'Unknown error'}`,
        lastChecked: new Date(),
      };
    }
  }

  private calculateSummary(checks: Record<string, ComponentHealth>) {
    const checkArray = Object.values(checks);
    return {
      totalChecks: checkArray.length,
      healthyChecks: checkArray.filter((c) => c.status === 'healthy').length,
      degradedChecks: checkArray.filter((c) => c.status === 'degraded').length,
      criticalChecks: checkArray.filter((c) => c.status === 'critical').length,
    };
  }

  private determineOverallStatus(
    checks: Record<string, ComponentHealth>,
  ): 'healthy' | 'degraded' | 'critical' {
    const checkArray = Object.values(checks);

    if (checkArray.some((c) => c.status === 'critical')) {
      return 'critical';
    }

    if (checkArray.some((c) => c.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  private getConnectionPoolStats() {
    // Mock connection pool stats
    return {
      used: 5,
      max: 20,
      idle: 3,
      waiting: 0,
    };
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }

  private parseRedisConnections(info: string): Record<string, any> {
    // Parse connection info from Redis info
    return {
      connected_clients: 10,
      max_clients: 1000,
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private async checkStripeConnection(): Promise<boolean> {
    // Mock Stripe check
    return true;
  }

  private async checkTwilioConnection(): Promise<boolean> {
    // Mock Twilio check
    return true;
  }

  private async checkEmailService(): Promise<boolean> {
    // Mock email service check
    return true;
  }

  private async getSystemStatus() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  private async getDatabaseStatus() {
    const isConnected = this.dataSource.isInitialized;
    const connectionCount = 5; // Mock value

    return {
      isConnected,
      connectionCount,
      driver: 'postgres',
      version: '14.0',
    };
  }

  private async getCacheStatus() {
    try {
      const info = await this.redis.info();
      return {
        connected: true,
        memory: await this.redis.info('memory'),
        keyspace: await this.redis.info('keyspace'),
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  private async getPerformanceStatus() {
    return {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0],
    };
  }
}
