import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: data.userId,
        action: data.action,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        isSuspicious: data.isSuspicious || false,
      });

      await this.auditLogRepository.save(auditLog);

      // Log suspicious activities
      if (data.isSuspicious) {
        this.logger.warn(`Suspicious activity detected: ${data.action} - ${data.description}`, {
          userId: data.userId,
          ipAddress: data.ipAddress,
          metadata: data.metadata,
        });
      }

      this.logger.debug(`Audit log created: ${data.action} for user ${data.userId}`);
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async getAuditLogs(
    userId?: string,
    action?: AuditAction,
    limit: number = 100,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (userId) {
      query.andWhere('audit.userId = :userId', { userId });
    }

    if (action) {
      query.andWhere('audit.action = :action', { action });
    }

    return query.orderBy('audit.createdAt', 'DESC').limit(limit).offset(offset).getMany();
  }

  async getSuspiciousActivities(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { isSuspicious: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getFailedLoginAttempts(
    ipAddress?: string,
    timeWindow: number = 24, // hours
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    query.where('audit.action = :action', { action: AuditAction.FAILED_LOGIN });

    if (ipAddress) {
      query.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
    }

    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - timeWindow);

    query.andWhere('audit.createdAt >= :timeThreshold', { timeThreshold });

    return query.orderBy('audit.createdAt', 'DESC').getMany();
  }

  async markAsSuspicious(auditLogId: string, reason?: string): Promise<void> {
    const existingLog = await this.auditLogRepository.findOne({ where: { id: auditLogId } });
    if (existingLog) {
      existingLog.isSuspicious = true;
      existingLog.metadata = { ...existingLog.metadata, suspiciousReason: reason };
      await this.auditLogRepository.save(existingLog);
    }
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old audit logs`);
  }
}
