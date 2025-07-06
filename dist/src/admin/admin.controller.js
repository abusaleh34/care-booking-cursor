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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_entity_1 = require("../database/entities/user-role.entity");
const admin_dashboard_service_1 = require("./services/admin-dashboard.service");
const admin_user_management_service_1 = require("./services/admin-user-management.service");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    constructor(dashboardService, userManagementService) {
        this.dashboardService = dashboardService;
        this.userManagementService = userManagementService;
    }
    async getDashboard(filter) {
        return await this.dashboardService.getDashboardOverview(filter);
    }
    async getGrowthAnalytics(filter) {
        return await this.dashboardService.getGrowthAnalytics(filter);
    }
    async getSystemHealth() {
        return await this.dashboardService.getSystemHealth();
    }
    async getFinancialOverview(filter) {
        return await this.dashboardService.getFinancialOverview(filter);
    }
    async createAdminUser(req, createAdminDto) {
        return await this.userManagementService.createAdminUser(createAdminDto);
    }
    async getAdminUsers(filter) {
        return await this.userManagementService.getAdminUsers(filter);
    }
    async updateAdminUser(adminId, updateDto) {
        return await this.userManagementService.updateAdminUser(adminId, updateDto);
    }
    async getUsers(filter) {
        return await this.userManagementService.getUsers(filter);
    }
    async getUserById(userId) {
        return await this.userManagementService.getUserById(userId);
    }
    async suspendUser(req, userId, reason) {
        const adminId = req.user.id;
        return await this.userManagementService.suspendUser(userId, reason, adminId);
    }
    async activateUser(req, userId) {
        const adminId = req.user.id;
        return await this.userManagementService.activateUser(userId, adminId);
    }
    async deleteUser(req, userId) {
        const adminId = req.user.id;
        return await this.userManagementService.deleteUser(userId, adminId);
    }
    async performBulkUserAction(req, bulkAction) {
        const adminId = req.user.id;
        return await this.userManagementService.performBulkAction(bulkAction, adminId);
    }
    async getProviderVerifications(filter) {
        return await this.userManagementService.getProviderVerifications(filter);
    }
    async reviewProviderVerification(req, verificationId, reviewDto) {
        const adminId = req.user.id;
        return await this.userManagementService.reviewProviderVerification(verificationId, reviewDto, adminId);
    }
    async getDisputes(filter) {
        return { message: 'Dispute management endpoint - to be implemented' };
    }
    async assignDispute(disputeId, assignment) {
        return { message: 'Dispute assignment endpoint - to be implemented' };
    }
    async resolveDispute(disputeId, resolution) {
        return { message: 'Dispute resolution endpoint - to be implemented' };
    }
    async getContentForModeration(filter) {
        return { message: 'Content moderation endpoint - to be implemented' };
    }
    async moderateContent(contentId, action) {
        return { message: 'Content moderation action endpoint - to be implemented' };
    }
    async getCommissionConfig() {
        return { message: 'Commission configuration endpoint - to be implemented' };
    }
    async updateCommissionConfig(config) {
        return { message: 'Commission update endpoint - to be implemented' };
    }
    async processPayouts(payout) {
        return { message: 'Payout processing endpoint - to be implemented' };
    }
    async getFinancialReports(filter) {
        return { message: 'Financial reports endpoint - to be implemented' };
    }
    async getPlatformSettings() {
        return { message: 'Platform settings endpoint - to be implemented' };
    }
    async createPlatformSetting(setting) {
        return { message: 'Create platform setting endpoint - to be implemented' };
    }
    async updatePlatformSetting(settingKey, setting) {
        return { message: 'Update platform setting endpoint - to be implemented' };
    }
    async getAuditLogs(filter) {
        return { message: 'Audit logs endpoint - to be implemented' };
    }
    async exportReports(filter) {
        return { message: 'Export reports endpoint - to be implemented' };
    }
    async getSystemAlerts() {
        return { message: 'System alerts endpoint - to be implemented' };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminDashboardFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('analytics/growth'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminDashboardFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getGrowthAnalytics", null);
__decorate([
    (0, common_1.Get)('system/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('financial/overview'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminDashboardFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFinancialOverview", null);
__decorate([
    (0, common_1.Post)('admins'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CreateAdminUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAdminUser", null);
__decorate([
    (0, common_1.Get)('admins'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.UserManagementFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminUsers", null);
__decorate([
    (0, common_1.Put)('admins/:adminId'),
    __param(0, (0, common_1.Param)('adminId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateAdminUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAdminUser", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.UserManagementFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)('users/:userId/suspend'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Put)('users/:userId/activate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Delete)('users/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('users/bulk-action'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.BulkUserActionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "performBulkUserAction", null);
__decorate([
    (0, common_1.Get)('verifications'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProviderVerifications", null);
__decorate([
    (0, common_1.Put)('verifications/:verificationId/review'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('verificationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.VerificationReviewDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reviewProviderVerification", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.DisputeFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDisputes", null);
__decorate([
    (0, common_1.Put)('disputes/:disputeId/assign'),
    __param(0, (0, common_1.Param)('disputeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.DisputeAssignmentDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignDispute", null);
__decorate([
    (0, common_1.Put)('disputes/:disputeId/resolve'),
    __param(0, (0, common_1.Param)('disputeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.DisputeResolutionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)('content/moderation'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.ContentModerationFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getContentForModeration", null);
__decorate([
    (0, common_1.Post)('content/:contentId/moderate'),
    __param(0, (0, common_1.Param)('contentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.ContentModerationActionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "moderateContent", null);
__decorate([
    (0, common_1.Get)('financial/commissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCommissionConfig", null);
__decorate([
    (0, common_1.Put)('financial/commissions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CommissionConfigDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCommissionConfig", null);
__decorate([
    (0, common_1.Post)('financial/payouts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.PayoutProcessingDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "processPayouts", null);
__decorate([
    (0, common_1.Get)('financial/reports'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.FinancialReportFilterDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFinancialReports", null);
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlatformSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.PlatformSettingDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPlatformSetting", null);
__decorate([
    (0, common_1.Put)('settings/:settingKey'),
    __param(0, (0, common_1.Param)('settingKey')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdatePlatformSettingDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePlatformSetting", null);
__decorate([
    (0, common_1.Get)('audit/logs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('reports/export'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportReports", null);
__decorate([
    (0, common_1.Get)('system/alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemAlerts", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_entity_1.RoleType.ADMIN),
    __metadata("design:paramtypes", [admin_dashboard_service_1.AdminDashboardService,
        admin_user_management_service_1.AdminUserManagementService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map