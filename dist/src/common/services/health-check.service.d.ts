import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
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
export declare class HealthCheckService {
    private dataSource;
    private configService;
    private readonly logger;
    private readonly config;
    private redis;
    constructor(dataSource: DataSource, configService: ConfigService);
    performHealthCheck(): Promise<HealthCheckResult>;
    private checkDatabase;
    private checkRedis;
    private checkMemory;
    private checkDisk;
    private checkExternalServices;
    private checkPerformance;
    getDetailedStatus(): Promise<{
        system: any;
        database: any;
        cache: any;
        performance: any;
    }>;
    private resolveHealth;
    private calculateSummary;
    private determineOverallStatus;
    private getConnectionPoolStats;
    private parseRedisInfo;
    private parseRedisConnections;
    private formatBytes;
    private checkStripeConnection;
    private checkTwilioConnection;
    private checkEmailService;
    private getSystemStatus;
    private getDatabaseStatus;
    private getCacheStatus;
    private getPerformanceStatus;
}
