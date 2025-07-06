import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';
import { collectDefaultMetrics, Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly config: any;

  // Prometheus Metrics
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly databaseQueryDuration: Histogram<string>;
  private readonly cacheOperations: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly memoryUsage: Gauge<string>;
  private readonly errorRate: Counter<string>;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get('optimization');

    // Initialize Prometheus metrics
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.cacheOperations = new Counter({
      name: 'cache_operations_total',
      help: 'Total cache operations',
      labelNames: ['operation', 'hit'],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
    });

    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
    });

    this.errorRate = new Counter({
      name: 'error_rate_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
    });

    // Collect default metrics
    if (this.config.monitoring.prometheus.enabled) {
      collectDefaultMetrics();
    }

    // Initialize Sentry if configured
    if (this.config.monitoring.sentry.dsn) {
      Sentry.init({
        dsn: this.config.monitoring.sentry.dsn,
        environment: this.config.monitoring.sentry.environment,
        tracesSampleRate: this.config.monitoring.sentry.tracesSampleRate,
        debug: this.config.monitoring.sentry.debug,
      });
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration / 1000); // Convert to seconds

    this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();

    // Log slow requests
    if (duration > this.config.thresholds.apiResponseTime.p95) {
      this.logger.warn(`Slow API request: ${method} ${route} - ${duration}ms`);
    }

    // Track error rates
    if (statusCode >= 400) {
      this.errorRate.labels('http', this.getErrorSeverity(statusCode)).inc();
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(queryType: string, table: string, duration: number) {
    this.databaseQueryDuration.labels(queryType, table).observe(duration / 1000);

    // Log slow queries
    if (duration > this.config.thresholds.databaseQuery.slow) {
      this.logger.warn(`Slow database query: ${queryType} on ${table} - ${duration}ms`);
    }

    // Alert on critical queries
    if (duration > this.config.thresholds.databaseQuery.critical) {
      this.logger.error(`Critical slow query: ${queryType} on ${table} - ${duration}ms`);
      this.recordError('database', 'critical', `Slow query: ${queryType} on ${table}`);
    }
  }

  /**
   * Record cache operations
   */
  recordCacheOperation(operation: 'get' | 'set' | 'del', hit: boolean) {
    this.cacheOperations.labels(operation, hit ? 'hit' : 'miss').inc();
  }

  /**
   * Update active connections
   */
  updateActiveConnections(type: string, count: number) {
    this.activeConnections.labels(type).set(count);
  }

  /**
   * Update memory usage
   */
  updateMemoryUsage() {
    const usage = process.memoryUsage();
    this.memoryUsage.labels('heap_used').set(usage.heapUsed);
    this.memoryUsage.labels('heap_total').set(usage.heapTotal);
    this.memoryUsage.labels('external').set(usage.external);
    this.memoryUsage.labels('rss').set(usage.rss);
  }

  /**
   * Record error with context
   */
  recordError(type: string, severity: string, message: string, extra?: any) {
    this.errorRate.labels(type, severity).inc();

    this.logger.error(`${type.toUpperCase()} Error [${severity}]: ${message}`, extra);

    // Send to Sentry if configured
    if (this.config.monitoring.sentry.dsn) {
      Sentry.captureException(new Error(message), {
        tags: { type, severity },
        extra,
      });
    }
  }

  /**
   * Get current metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Calculate cache hit rate
   */
  async getCacheHitRate(): Promise<number> {
    const metrics = await register.getSingleMetric('cache_operations_total');
    if (!metrics) return 0;

    // This is a simplified calculation - in production, you'd want more sophisticated logic
    const hits = await this.getCacheMetricValue('get', 'hit');
    const misses = await this.getCacheMetricValue('get', 'miss');

    return hits + misses > 0 ? hits / (hits + misses) : 0;
  }

  /**
   * Get API response time percentiles
   */
  async getApiResponseTimePercentiles(): Promise<{
    p50: number;
    p95: number;
    p99: number;
  }> {
    // This would typically query your metrics storage
    // For now, returning mock data
    return {
      p50: 120,
      p95: 280,
      p99: 450,
    };
  }

  /**
   * Check system health based on metrics
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Check cache hit rate
    const cacheHitRate = await this.getCacheHitRate();
    if (cacheHitRate < this.config.thresholds.cacheHitRate.critical) {
      issues.push(`Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
      status = 'critical';
    } else if (cacheHitRate < this.config.thresholds.cacheHitRate.warning) {
      issues.push(`Cache hit rate below target: ${(cacheHitRate * 100).toFixed(1)}%`);
      if (status === 'healthy') status = 'degraded';
    }

    // Check API response times
    const responseTimesz = await this.getApiResponseTimePercentiles();
    if (responseTimesz.p95 > this.config.thresholds.apiResponseTime.p95) {
      issues.push(`High API response times: P95 ${responseTimesz.p95}ms`);
      if (status !== 'critical') status = 'degraded';
    }

    // Update memory usage
    this.updateMemoryUsage();

    return {
      status,
      issues,
      metrics: {
        cacheHitRate: (cacheHitRate * 100).toFixed(1) + '%',
        apiResponseTime: responseTimesz,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };
  }

  /**
   * Performance alert handler
   */
  private handlePerformanceAlert(type: string, message: string, severity: 'warning' | 'critical') {
    this.logger.warn(`Performance Alert [${severity.toUpperCase()}]: ${message}`);

    // Send to external monitoring services
    if (this.config.monitoring.sentry.dsn) {
      Sentry.captureMessage(message, severity as any);
    }

    // Here you could integrate with PagerDuty, Slack, etc.
  }

  /**
   * Scheduled health check
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async scheduledHealthCheck() {
    if (!this.config.monitoring.enabled) return;

    try {
      const health = await this.checkSystemHealth();

      if (health.status === 'critical') {
        this.handlePerformanceAlert(
          'system',
          `System critical: ${health.issues.join(', ')}`,
          'critical',
        );
      } else if (health.status === 'degraded') {
        this.handlePerformanceAlert(
          'system',
          `System degraded: ${health.issues.join(', ')}`,
          'warning',
        );
      }
    } catch (error) {
      this.logger.error('Health check failed', error);
    }
  }

  /**
   * Business metrics tracking
   */
  recordBusinessMetric(metric: string, value: number, labels?: Record<string, string>) {
    const gauge = new Gauge({
      name: `business_${metric}`,
      help: `Business metric: ${metric}`,
      labelNames: labels ? Object.keys(labels) : [],
    });

    if (labels) {
      gauge.labels(labels).set(value);
    } else {
      gauge.set(value);
    }
  }

  private getErrorSeverity(statusCode: number): string {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'warning';
    return 'info';
  }

  private async getCacheMetricValue(operation: string, hit: string): Promise<number> {
    // This would query your metrics storage for actual values
    // For now, returning mock data
    return Math.floor(Math.random() * 100);
  }
}
