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
var OptimizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_optimization_service_1 = require("./cache-optimization.service");
const performance_monitoring_service_1 = require("./performance-monitoring.service");
const health_check_service_1 = require("./health-check.service");
let OptimizationService = OptimizationService_1 = class OptimizationService {
    constructor(configService, cacheService, performanceService, healthService) {
        this.configService = configService;
        this.cacheService = cacheService;
        this.performanceService = performanceService;
        this.healthService = healthService;
        this.logger = new common_1.Logger(OptimizationService_1.name);
    }
    async initialize() {
        this.logger.log('Initializing optimization services...');
        try {
            await this.initializeCacheWarming();
            await this.initializePerformanceMonitoring();
            await this.initializeHealthChecks();
            this.logger.log('Optimization services initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize optimization services:', error);
        }
    }
    async getOptimizationStatus() {
        try {
            const [cacheStats, healthStatus] = await Promise.all([
                this.cacheService.getCacheStats(),
                this.healthService.performHealthCheck(),
            ]);
            const recommendations = this.generateRecommendations(cacheStats, healthStatus);
            return {
                cache: cacheStats,
                performance: {
                    enabled: true,
                    monitoring: 'active',
                },
                health: healthStatus,
                recommendations,
            };
        }
        catch (error) {
            this.logger.error('Failed to get optimization status:', error);
            return {
                cache: {},
                performance: {},
                health: {},
                recommendations: ['Optimization status check failed'],
            };
        }
    }
    async performCleanup() {
        try {
            const cacheCleanup = await this.cacheService.cleanup();
            return {
                cacheCleanup,
                performanceCleanup: { status: 'completed' },
                success: true,
            };
        }
        catch (error) {
            this.logger.error('Optimization cleanup failed:', error);
            return {
                cacheCleanup: {},
                performanceCleanup: {},
                success: false,
            };
        }
    }
    async initializeCacheWarming() {
        const warmingStrategy = [
            {
                key: 'service_categories',
                loader: async () => ({ categories: [] }),
                ttl: 3600,
                prefix: 'static',
            },
        ];
        await this.cacheService.warmCache(warmingStrategy);
    }
    async initializePerformanceMonitoring() {
        this.logger.debug('Performance monitoring initialized');
    }
    async initializeHealthChecks() {
        this.logger.debug('Health checks initialized');
    }
    generateRecommendations(cacheStats, healthStatus) {
        const recommendations = [];
        if (cacheStats.hitRate < 0.8) {
            recommendations.push('Consider optimizing cache hit rate (currently below 80%)');
        }
        if (healthStatus.status !== 'healthy') {
            recommendations.push('System health issues detected - investigate components');
        }
        if (recommendations.length === 0) {
            recommendations.push('System is performing optimally');
        }
        return recommendations;
    }
};
exports.OptimizationService = OptimizationService;
exports.OptimizationService = OptimizationService = OptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        cache_optimization_service_1.CacheOptimizationService,
        performance_monitoring_service_1.PerformanceMonitoringService,
        health_check_service_1.HealthCheckService])
], OptimizationService);
//# sourceMappingURL=optimization.service.js.map