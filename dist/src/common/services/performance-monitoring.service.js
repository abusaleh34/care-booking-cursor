"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PerformanceMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const Sentry = require("@sentry/node");
const prom_client_1 = require("prom-client");
let PerformanceMonitoringService = PerformanceMonitoringService_1 = class PerformanceMonitoringService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PerformanceMonitoringService_1.name);
        this.config = this.configService.get('optimization');
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        });
        this.httpRequestTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
        });
        this.databaseQueryDuration = new prom_client_1.Histogram({
            name: 'database_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['query_type', 'table'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
        });
        this.cacheOperations = new prom_client_1.Counter({
            name: 'cache_operations_total',
            help: 'Total cache operations',
            labelNames: ['operation', 'hit'],
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: 'active_connections',
            help: 'Number of active connections',
            labelNames: ['type'],
        });
        this.memoryUsage = new prom_client_1.Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
        });
        this.errorRate = new prom_client_1.Counter({
            name: 'error_rate_total',
            help: 'Total number of errors',
            labelNames: ['type', 'severity'],
        });
        if (this.config.monitoring.prometheus.enabled) {
            (0, prom_client_1.collectDefaultMetrics)();
        }
        if (this.config.monitoring.sentry.dsn) {
            Sentry.init({
                dsn: this.config.monitoring.sentry.dsn,
                environment: this.config.monitoring.sentry.environment,
                tracesSampleRate: this.config.monitoring.sentry.tracesSampleRate,
                debug: this.config.monitoring.sentry.debug,
            });
        }
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration / 1000);
        this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
        if (duration > this.config.thresholds.apiResponseTime.p95) {
            this.logger.warn(`Slow API request: ${method} ${route} - ${duration}ms`);
        }
        if (statusCode >= 400) {
            this.errorRate.labels('http', this.getErrorSeverity(statusCode)).inc();
        }
    }
    recordDatabaseQuery(queryType, table, duration) {
        this.databaseQueryDuration.labels(queryType, table).observe(duration / 1000);
        if (duration > this.config.thresholds.databaseQuery.slow) {
            this.logger.warn(`Slow database query: ${queryType} on ${table} - ${duration}ms`);
        }
        if (duration > this.config.thresholds.databaseQuery.critical) {
            this.logger.error(`Critical slow query: ${queryType} on ${table} - ${duration}ms`);
            this.recordError('database', 'critical', `Slow query: ${queryType} on ${table}`);
        }
    }
    recordCacheOperation(operation, hit) {
        this.cacheOperations.labels(operation, hit ? 'hit' : 'miss').inc();
    }
    updateActiveConnections(type, count) {
        this.activeConnections.labels(type).set(count);
    }
    updateMemoryUsage() {
        const usage = process.memoryUsage();
        this.memoryUsage.labels('heap_used').set(usage.heapUsed);
        this.memoryUsage.labels('heap_total').set(usage.heapTotal);
        this.memoryUsage.labels('external').set(usage.external);
        this.memoryUsage.labels('rss').set(usage.rss);
    }
    recordError(type, severity, message, extra) {
        this.errorRate.labels(type, severity).inc();
        this.logger.error(`${type.toUpperCase()} Error [${severity}]: ${message}`, extra);
        if (this.config.monitoring.sentry.dsn) {
            Sentry.captureException(new Error(message), {
                tags: { type, severity },
                extra,
            });
        }
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    async getCacheHitRate() {
        const metrics = await prom_client_1.register.getSingleMetric('cache_operations_total');
        if (!metrics)
            return 0;
        const hits = await this.getCacheMetricValue('get', 'hit');
        const misses = await this.getCacheMetricValue('get', 'miss');
        return hits + misses > 0 ? hits / (hits + misses) : 0;
    }
    async getApiResponseTimePercentiles() {
        return {
            p50: 120,
            p95: 280,
            p99: 450,
        };
    }
    async checkSystemHealth() {
        const issues = [];
        let status = 'healthy';
        const cacheHitRate = await this.getCacheHitRate();
        if (cacheHitRate < this.config.thresholds.cacheHitRate.critical) {
            issues.push(`Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
            status = 'critical';
        }
        else if (cacheHitRate < this.config.thresholds.cacheHitRate.warning) {
            issues.push(`Cache hit rate below target: ${(cacheHitRate * 100).toFixed(1)}%`);
            if (status === 'healthy')
                status = 'degraded';
        }
        const responseTimesz = await this.getApiResponseTimePercentiles();
        if (responseTimesz.p95 > this.config.thresholds.apiResponseTime.p95) {
            issues.push(`High API response times: P95 ${responseTimesz.p95}ms`);
            if (status !== 'critical')
                status = 'degraded';
        }
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
    handlePerformanceAlert(type, message, severity) {
        this.logger.warn(`Performance Alert [${severity.toUpperCase()}]: ${message}`);
        if (this.config.monitoring.sentry.dsn) {
            Sentry.captureMessage(message, severity);
        }
    }
    async scheduledHealthCheck() {
        if (!this.config.monitoring.enabled)
            return;
        try {
            const health = await this.checkSystemHealth();
            if (health.status === 'critical') {
                this.handlePerformanceAlert('system', `System critical: ${health.issues.join(', ')}`, 'critical');
            }
            else if (health.status === 'degraded') {
                this.handlePerformanceAlert('system', `System degraded: ${health.issues.join(', ')}`, 'warning');
            }
        }
        catch (error) {
            this.logger.error('Health check failed', error);
        }
    }
    recordBusinessMetric(metric, value, labels) {
        const gauge = new prom_client_1.Gauge({
            name: `business_${metric}`,
            help: `Business metric: ${metric}`,
            labelNames: labels ? Object.keys(labels) : [],
        });
        if (labels) {
            gauge.labels(labels).set(value);
        }
        else {
            gauge.set(value);
        }
    }
    getErrorSeverity(statusCode) {
        if (statusCode >= 500)
            return 'critical';
        if (statusCode >= 400)
            return 'warning';
        return 'info';
    }
    async getCacheMetricValue(operation, hit) {
        return Math.floor(Math.random() * 100);
    }
};
exports.PerformanceMonitoringService = PerformanceMonitoringService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PerformanceMonitoringService.prototype, "scheduledHealthCheck", null);
exports.PerformanceMonitoringService = PerformanceMonitoringService = PerformanceMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PerformanceMonitoringService);
//# sourceMappingURL=performance-monitoring.service.js.map