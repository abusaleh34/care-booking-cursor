import { ConfigService } from '@nestjs/config';
export declare class PerformanceMonitoringService {
    private configService;
    private readonly logger;
    private readonly config;
    private readonly httpRequestDuration;
    private readonly httpRequestTotal;
    private readonly databaseQueryDuration;
    private readonly cacheOperations;
    private readonly activeConnections;
    private readonly memoryUsage;
    private readonly errorRate;
    constructor(configService: ConfigService);
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    recordDatabaseQuery(queryType: string, table: string, duration: number): void;
    recordCacheOperation(operation: 'get' | 'set' | 'del', hit: boolean): void;
    updateActiveConnections(type: string, count: number): void;
    updateMemoryUsage(): void;
    recordError(type: string, severity: string, message: string, extra?: any): void;
    getMetrics(): Promise<string>;
    getCacheHitRate(): Promise<number>;
    getApiResponseTimePercentiles(): Promise<{
        p50: number;
        p95: number;
        p99: number;
    }>;
    checkSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'critical';
        issues: string[];
        metrics: any;
    }>;
    private handlePerformanceAlert;
    scheduledHealthCheck(): Promise<void>;
    recordBusinessMetric(metric: string, value: number, labels?: Record<string, string>): void;
    private getErrorSeverity;
    private getCacheMetricValue;
}
