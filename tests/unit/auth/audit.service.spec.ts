import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../../../src/auth/services/audit.service';
import { AuditLog, AuditAction } from '../../../src/database/entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepository: Repository<AuditLog>;

  const mockAuditLog = {
    id: 'audit-123',
    userId: 'user-123',
    action: AuditAction.LOGIN,
    resource: 'auth',
    details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    timestamp: new Date('2025-07-16T10:30:00Z'),
    success: true
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            count: vi.fn(),
            createQueryBuilder: vi.fn()
          }
        }
      ]
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepository = module.get(getRepositoryToken(AuditLog));

    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should create and save audit log entry', async () => {
      const logData = {
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resource: 'auth',
        details: { ip: '192.168.1.1' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true
      };

      const createdLog = { ...mockAuditLog, ...logData };
      vi.mocked(auditLogRepository.create).mockReturnValue(createdLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(createdLog as any);

      const result = await service.log(logData);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date)
      });
      expect(auditLogRepository.save).toHaveBeenCalledWith(createdLog);
      expect(result).toEqual(createdLog);
    });

    it('should handle minimal required fields', async () => {
      const logData = {
        userId: 'user-123',
        action: AuditAction.LOGOUT,
        resource: 'auth'
      };

      const createdLog = { ...mockAuditLog, ...logData };
      vi.mocked(auditLogRepository.create).mockReturnValue(createdLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(createdLog as any);

      await service.log(logData);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date)
      });
    });

    it('should handle complex details object', async () => {
      const logData = {
        userId: 'user-123',
        action: AuditAction.DATA_EXPORT,
        resource: 'user_data',
        details: {
          exportType: 'full',
          fileFormat: 'json',
          fileSize: 1024,
          filters: {
            dateRange: '2025-01-01 to 2025-07-16',
            categories: ['bookings', 'payments']
          }
        }
      };

      const createdLog = { ...mockAuditLog, ...logData };
      vi.mocked(auditLogRepository.create).mockReturnValue(createdLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(createdLog as any);

      await service.log(logData);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        ...logData,
        timestamp: expect.any(Date)
      });
    });

    it('should handle database save errors', async () => {
      const logData = {
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resource: 'auth'
      };

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockRejectedValue(new Error('Database error'));

      await expect(service.log(logData)).rejects.toThrow('Database error');
    });
  });

  describe('logLogin', () => {
    it('should log successful login', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logLogin(userId, ipAddress, userAgent, true);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.LOGIN,
        resource: 'auth',
        details: { loginResult: 'success' },
        ipAddress,
        userAgent,
        success: true,
        timestamp: expect.any(Date)
      });
    });

    it('should log failed login', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logLogin(userId, ipAddress, userAgent, false);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.LOGIN,
        resource: 'auth',
        details: { loginResult: 'failed' },
        ipAddress,
        userAgent,
        success: false,
        timestamp: expect.any(Date)
      });
    });

    it('should handle missing optional parameters', async () => {
      const userId = 'user-123';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logLogin(userId);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.LOGIN,
        resource: 'auth',
        details: { loginResult: 'success' },
        ipAddress: undefined,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logLogout', () => {
    it('should log logout event', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logLogout(userId, ipAddress, userAgent);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.LOGOUT,
        resource: 'auth',
        details: {},
        ipAddress,
        userAgent,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logPasswordChange', () => {
    it('should log password change event', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';
      const userAgent = 'Mozilla/5.0';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logPasswordChange(userId, ipAddress, userAgent);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.PASSWORD_CHANGE,
        resource: 'user_security',
        details: { changeType: 'password_update' },
        ipAddress,
        userAgent,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logAccountLock', () => {
    it('should log account lock event', async () => {
      const userId = 'user-123';
      const reason = 'Multiple failed login attempts';
      const ipAddress = '192.168.1.1';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logAccountLock(userId, reason, ipAddress);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.ACCOUNT_LOCK,
        resource: 'user_security',
        details: { reason },
        ipAddress,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logAccountUnlock', () => {
    it('should log account unlock event', async () => {
      const userId = 'user-123';
      const unlockedBy = 'admin-456';
      const ipAddress = '192.168.1.1';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logAccountUnlock(userId, unlockedBy, ipAddress);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.ACCOUNT_UNLOCK,
        resource: 'user_security',
        details: { unlockedBy },
        ipAddress,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logDataAccess', () => {
    it('should log data access event', async () => {
      const userId = 'user-123';
      const resource = 'customer_data';
      const resourceId = 'customer-456';
      const operation = 'read';

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logDataAccess(userId, resource, resourceId, operation);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.DATA_ACCESS,
        resource,
        details: { resourceId, operation },
        ipAddress: undefined,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logDataExport', () => {
    it('should log data export event', async () => {
      const userId = 'user-123';
      const exportType = 'customer_bookings';
      const filters = { dateRange: '2025-01-01 to 2025-07-16' };

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logDataExport(userId, exportType, filters);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId,
        action: AuditAction.DATA_EXPORT,
        resource: 'data_export',
        details: { exportType, filters },
        ipAddress: undefined,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('logSystemEvent', () => {
    it('should log system event', async () => {
      const event = 'backup_completed';
      const details = { backupSize: '1.2GB', duration: '15 minutes' };

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockResolvedValue(mockAuditLog as any);

      await service.logSystemEvent(event, details);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 'system',
        action: AuditAction.SYSTEM_EVENT,
        resource: 'system',
        details: { event, ...details },
        ipAddress: undefined,
        userAgent: undefined,
        success: true,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve user audit logs with pagination', async () => {
      const userId = 'user-123';
      const page = 1;
      const limit = 10;
      const logs = [mockAuditLog];

      vi.mocked(auditLogRepository.find).mockResolvedValue(logs as any);

      const result = await service.getUserAuditLogs(userId, page, limit);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        skip: 0,
        take: 10
      });
      expect(result).toEqual(logs);
    });

    it('should handle different pagination parameters', async () => {
      const userId = 'user-123';
      const page = 3;
      const limit = 25;
      const logs = [mockAuditLog];

      vi.mocked(auditLogRepository.find).mockResolvedValue(logs as any);

      await service.getUserAuditLogs(userId, page, limit);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        skip: 50, // (3-1) * 25
        take: 25
      });
    });
  });

  describe('getAuditLogsByAction', () => {
    it('should retrieve audit logs by action', async () => {
      const action = AuditAction.LOGIN;
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-16');
      const logs = [mockAuditLog];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(logs)
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAuditLogsByAction(action, startDate, endDate);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('action = :action', { action });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'timestamp >= :startDate AND timestamp <= :endDate',
        { startDate, endDate }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('timestamp', 'DESC');
      expect(result).toEqual(logs);
    });

    it('should handle queries without date range', async () => {
      const action = AuditAction.LOGIN;
      const logs = [mockAuditLog];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(logs)
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      await service.getAuditLogsByAction(action);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('action = :action', { action });
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should count failed login attempts', async () => {
      const userId = 'user-123';
      const timeWindow = 30; // minutes
      const count = 5;

      vi.mocked(auditLogRepository.count).mockResolvedValue(count);

      const result = await service.getFailedLoginAttempts(userId, timeWindow);

      expect(auditLogRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          action: AuditAction.LOGIN,
          success: false,
          timestamp: expect.any(Object) // MoreThanOrEqual matcher
        }
      });
      expect(result).toBe(count);
    });

    it('should use default time window', async () => {
      const userId = 'user-123';
      const count = 3;

      vi.mocked(auditLogRepository.count).mockResolvedValue(count);

      const result = await service.getFailedLoginAttempts(userId);

      expect(result).toBe(count);
      expect(auditLogRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          action: AuditAction.LOGIN,
          success: false,
          timestamp: expect.any(Object)
        }
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should retrieve recent activity for user', async () => {
      const userId = 'user-123';
      const limit = 20;
      const logs = [mockAuditLog];

      vi.mocked(auditLogRepository.find).mockResolvedValue(logs as any);

      const result = await service.getRecentActivity(userId, limit);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        take: 20
      });
      expect(result).toEqual(logs);
    });

    it('should use default limit', async () => {
      const userId = 'user-123';
      const logs = [mockAuditLog];

      vi.mocked(auditLogRepository.find).mockResolvedValue(logs as any);

      await service.getRecentActivity(userId);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { timestamp: 'DESC' },
        take: 50
      });
    });
  });

  describe('getSystemAuditLogs', () => {
    it('should retrieve system audit logs', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-16');
      const logs = [mockAuditLog];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(logs)
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSystemAuditLogs(startDate, endDate);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userId = :userId', { userId: 'system' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'timestamp >= :startDate AND timestamp <= :endDate',
        { startDate, endDate }
      );
      expect(result).toEqual(logs);
    });
  });

  describe('getAuditStatistics', () => {
    it('should return audit statistics', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-16');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { action: 'LOGIN', count: '150' },
          { action: 'LOGOUT', count: '140' },
          { action: 'PASSWORD_CHANGE', count: '5' }
        ])
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAuditStatistics(startDate, endDate);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'timestamp >= :startDate AND timestamp <= :endDate',
        { startDate, endDate }
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('action, COUNT(*) as count');
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('action');
      expect(result).toEqual([
        { action: 'LOGIN', count: '150' },
        { action: 'LOGOUT', count: '140' },
        { action: 'PASSWORD_CHANGE', count: '5' }
      ]);
    });
  });

  describe('cleanupOldLogs', () => {
    it('should cleanup old audit logs', async () => {
      const daysToKeep = 90;
      const deleteResult = { affected: 1000 };

      const mockQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(deleteResult)
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.cleanupOldLogs(daysToKeep);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('timestamp < :cutoffDate', {
        cutoffDate: expect.any(Date)
      });
      expect(result).toEqual(deleteResult);
    });

    it('should use default retention period', async () => {
      const deleteResult = { affected: 500 };

      const mockQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(deleteResult)
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      const result = await service.cleanupOldLogs();

      expect(result).toEqual(deleteResult);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const logData = {
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resource: 'auth'
      };

      vi.mocked(auditLogRepository.create).mockReturnValue(mockAuditLog as any);
      vi.mocked(auditLogRepository.save).mockRejectedValue(new Error('Database connection failed'));

      await expect(service.log(logData)).rejects.toThrow('Database connection failed');
    });

    it('should handle query builder errors', async () => {
      const action = AuditAction.LOGIN;
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-16');

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockRejectedValue(new Error('Query failed'))
      };

      vi.mocked(auditLogRepository.createQueryBuilder).mockReturnValue(mockQueryBuilder as any);

      await expect(service.getAuditLogsByAction(action, startDate, endDate))
        .rejects.toThrow('Query failed');
    });
  });
});