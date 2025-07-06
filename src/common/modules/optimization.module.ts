import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

// Import only existing services
import { CacheOptimizationService } from '../services/cache-optimization.service';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';
import { HealthCheckService } from '../services/health-check.service';
import { OptimizationService } from '../services/optimization.service';

@Module({
  imports: [ConfigModule, CacheModule.register()],
  providers: [
    CacheOptimizationService,
    PerformanceMonitoringService,
    HealthCheckService,
    OptimizationService,
  ],
  exports: [
    CacheOptimizationService,
    PerformanceMonitoringService,
    HealthCheckService,
    OptimizationService,
  ],
})
export class OptimizationModule {}
