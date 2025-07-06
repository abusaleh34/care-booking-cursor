import { ConfigService } from '@nestjs/config';
import { CacheOptimizationService } from './cache-optimization.service';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { HealthCheckService } from './health-check.service';
export declare class OptimizationService {
    private readonly configService;
    private readonly cacheService;
    private readonly performanceService;
    private readonly healthService;
    private readonly logger;
    constructor(configService: ConfigService, cacheService: CacheOptimizationService, performanceService: PerformanceMonitoringService, healthService: HealthCheckService);
    initialize(): Promise<void>;
    getOptimizationStatus(): Promise<{
        cache: any;
        performance: any;
        health: any;
        recommendations: string[];
    }>;
    performCleanup(): Promise<{
        cacheCleanup: any;
        performanceCleanup: any;
        success: boolean;
    }>;
    private initializeCacheWarming;
    private initializePerformanceMonitoring;
    private initializeHealthChecks;
    private generateRecommendations;
}
