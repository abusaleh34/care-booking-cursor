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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
let AuditService = AuditService_1 = class AuditService {
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(data) {
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
            if (data.isSuspicious) {
                this.logger.warn(`Suspicious activity detected: ${data.action} - ${data.description}`, {
                    userId: data.userId,
                    ipAddress: data.ipAddress,
                    metadata: data.metadata,
                });
            }
            this.logger.debug(`Audit log created: ${data.action} for user ${data.userId}`);
        }
        catch (error) {
            this.logger.error('Failed to create audit log:', error);
        }
    }
    async getAuditLogs(userId, action, limit = 100, offset = 0) {
        const query = this.auditLogRepository.createQueryBuilder('audit');
        if (userId) {
            query.andWhere('audit.userId = :userId', { userId });
        }
        if (action) {
            query.andWhere('audit.action = :action', { action });
        }
        return query.orderBy('audit.createdAt', 'DESC').limit(limit).offset(offset).getMany();
    }
    async getSuspiciousActivities(limit = 50, offset = 0) {
        return this.auditLogRepository.find({
            where: { isSuspicious: true },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }
    async getFailedLoginAttempts(ipAddress, timeWindow = 24) {
        const query = this.auditLogRepository.createQueryBuilder('audit');
        query.where('audit.action = :action', { action: audit_log_entity_1.AuditAction.FAILED_LOGIN });
        if (ipAddress) {
            query.andWhere('audit.ipAddress = :ipAddress', { ipAddress });
        }
        const timeThreshold = new Date();
        timeThreshold.setHours(timeThreshold.getHours() - timeWindow);
        query.andWhere('audit.createdAt >= :timeThreshold', { timeThreshold });
        return query.orderBy('audit.createdAt', 'DESC').getMany();
    }
    async markAsSuspicious(auditLogId, reason) {
        const existingLog = await this.auditLogRepository.findOne({ where: { id: auditLogId } });
        if (existingLog) {
            existingLog.isSuspicious = true;
            existingLog.metadata = { ...existingLog.metadata, suspiciousReason: reason };
            await this.auditLogRepository.save(existingLog);
        }
    }
    async cleanupOldLogs(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await this.auditLogRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();
        this.logger.log(`Cleaned up ${result.affected} old audit logs`);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map