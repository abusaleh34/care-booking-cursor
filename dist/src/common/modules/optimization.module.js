"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const cache_optimization_service_1 = require("../services/cache-optimization.service");
const performance_monitoring_service_1 = require("../services/performance-monitoring.service");
const health_check_service_1 = require("../services/health-check.service");
const optimization_service_1 = require("../services/optimization.service");
let OptimizationModule = class OptimizationModule {
};
exports.OptimizationModule = OptimizationModule;
exports.OptimizationModule = OptimizationModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, cache_manager_1.CacheModule.register()],
        providers: [
            cache_optimization_service_1.CacheOptimizationService,
            performance_monitoring_service_1.PerformanceMonitoringService,
            health_check_service_1.HealthCheckService,
            optimization_service_1.OptimizationService,
        ],
        exports: [
            cache_optimization_service_1.CacheOptimizationService,
            performance_monitoring_service_1.PerformanceMonitoringService,
            health_check_service_1.HealthCheckService,
            optimization_service_1.OptimizationService,
        ],
    })
], OptimizationModule);
//# sourceMappingURL=optimization.module.js.map