import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from '../../database/entities/audit-log.entity';
export interface AuditLogData {
    userId?: string;
    action: AuditAction;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    isSuspicious?: boolean;
}
export declare class AuditService {
    private readonly auditLogRepository;
    private readonly logger;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(data: AuditLogData): Promise<void>;
    getAuditLogs(userId?: string, action?: AuditAction, limit?: number, offset?: number): Promise<AuditLog[]>;
    getSuspiciousActivities(limit?: number, offset?: number): Promise<AuditLog[]>;
    getFailedLoginAttempts(ipAddress?: string, timeWindow?: number): Promise<AuditLog[]>;
    markAsSuspicious(auditLogId: string, reason?: string): Promise<void>;
    cleanupOldLogs(daysToKeep?: number): Promise<void>;
}
