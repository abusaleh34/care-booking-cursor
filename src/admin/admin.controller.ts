import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../database/entities/user-role.entity';

// Services
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUserManagementService } from './services/admin-user-management.service';

// DTOs
import {
  AdminDashboardFilterDto,
  BulkUserActionDto,
  CommissionConfigDto,
  ContentModerationActionDto,
  ContentModerationFilterDto,
  CreateAdminUserDto,
  DisputeAssignmentDto,
  DisputeFilterDto,
  DisputeResolutionDto,
  FinancialReportFilterDto,
  PayoutProcessingDto,
  PlatformSettingDto,
  UpdateAdminUserDto,
  UpdatePlatformSettingDto,
  UserManagementFilterDto,
  VerificationReviewDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN)
export class AdminController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly userManagementService: AdminUserManagementService,
  ) {}

  // ========== DASHBOARD & ANALYTICS ENDPOINTS ==========

  @Get('dashboard')
  async getDashboard(@Query() filter: AdminDashboardFilterDto) {
    return await this.dashboardService.getDashboardOverview(filter);
  }

  @Get('analytics/growth')
  async getGrowthAnalytics(@Query() filter: AdminDashboardFilterDto) {
    return await this.dashboardService.getGrowthAnalytics(filter);
  }

  @Get('system/health')
  async getSystemHealth() {
    return await this.dashboardService.getSystemHealth();
  }

  @Get('financial/overview')
  async getFinancialOverview(@Query() filter: AdminDashboardFilterDto) {
    return await this.dashboardService.getFinancialOverview(filter);
  }

  // ========== ADMIN USER MANAGEMENT ENDPOINTS ==========

  @Post('admins')
  async createAdminUser(@Request() req, @Body() createAdminDto: CreateAdminUserDto) {
    return await this.userManagementService.createAdminUser(createAdminDto);
  }

  @Get('admins')
  async getAdminUsers(@Query() filter: UserManagementFilterDto) {
    return await this.userManagementService.getAdminUsers(filter);
  }

  @Put('admins/:adminId')
  async updateAdminUser(@Param('adminId') adminId: string, @Body() updateDto: UpdateAdminUserDto) {
    return await this.userManagementService.updateAdminUser(adminId, updateDto);
  }

  // ========== USER MANAGEMENT ENDPOINTS ==========

  @Get('users')
  async getUsers(@Query() filter: UserManagementFilterDto) {
    return await this.userManagementService.getUsers(filter);
  }

  @Get('users/:userId')
  async getUserById(@Param('userId') userId: string) {
    return await this.userManagementService.getUserById(userId);
  }

  @Put('users/:userId/suspend')
  async suspendUser(
    @Request() req,
    @Param('userId') userId: string,
    @Body('reason') reason: string,
  ) {
    const adminId = req.user.id;
    return await this.userManagementService.suspendUser(userId, reason, adminId);
  }

  @Put('users/:userId/activate')
  async activateUser(@Request() req, @Param('userId') userId: string) {
    const adminId = req.user.id;
    return await this.userManagementService.activateUser(userId, adminId);
  }

  @Delete('users/:userId')
  async deleteUser(@Request() req, @Param('userId') userId: string) {
    const adminId = req.user.id;
    return await this.userManagementService.deleteUser(userId, adminId);
  }

  @Post('users/bulk-action')
  async performBulkUserAction(@Request() req, @Body() bulkAction: BulkUserActionDto) {
    const adminId = req.user.id;
    return await this.userManagementService.performBulkAction(bulkAction, adminId);
  }

  // ========== PROVIDER VERIFICATION ENDPOINTS ==========

  @Get('verifications')
  async getProviderVerifications(@Query() filter: any) {
    return await this.userManagementService.getProviderVerifications(filter);
  }

  @Put('verifications/:verificationId/review')
  async reviewProviderVerification(
    @Request() req,
    @Param('verificationId') verificationId: string,
    @Body() reviewDto: VerificationReviewDto,
  ) {
    const adminId = req.user.id;
    return await this.userManagementService.reviewProviderVerification(
      verificationId,
      reviewDto,
      adminId,
    );
  }

  // ========== PLACEHOLDER ENDPOINTS FOR ADDITIONAL SERVICES ==========
  // These would be implemented with additional services

  @Get('disputes')
  async getDisputes(@Query() filter: DisputeFilterDto) {
    // Would use DisputeManagementService
    return { message: 'Dispute management endpoint - to be implemented' };
  }

  @Put('disputes/:disputeId/assign')
  async assignDispute(
    @Param('disputeId') disputeId: string,
    @Body() assignment: DisputeAssignmentDto,
  ) {
    return { message: 'Dispute assignment endpoint - to be implemented' };
  }

  @Put('disputes/:disputeId/resolve')
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() resolution: DisputeResolutionDto,
  ) {
    return { message: 'Dispute resolution endpoint - to be implemented' };
  }

  @Get('content/moderation')
  async getContentForModeration(@Query() filter: ContentModerationFilterDto) {
    return { message: 'Content moderation endpoint - to be implemented' };
  }

  @Post('content/:contentId/moderate')
  async moderateContent(
    @Param('contentId') contentId: string,
    @Body() action: ContentModerationActionDto,
  ) {
    return { message: 'Content moderation action endpoint - to be implemented' };
  }

  @Get('financial/commissions')
  async getCommissionConfig() {
    return { message: 'Commission configuration endpoint - to be implemented' };
  }

  @Put('financial/commissions')
  async updateCommissionConfig(@Body() config: CommissionConfigDto) {
    return { message: 'Commission update endpoint - to be implemented' };
  }

  @Post('financial/payouts')
  async processPayouts(@Body() payout: PayoutProcessingDto) {
    return { message: 'Payout processing endpoint - to be implemented' };
  }

  @Get('financial/reports')
  async getFinancialReports(@Query() filter: FinancialReportFilterDto) {
    return { message: 'Financial reports endpoint - to be implemented' };
  }

  @Get('settings')
  async getPlatformSettings() {
    return { message: 'Platform settings endpoint - to be implemented' };
  }

  @Post('settings')
  async createPlatformSetting(@Body() setting: PlatformSettingDto) {
    return { message: 'Create platform setting endpoint - to be implemented' };
  }

  @Put('settings/:settingKey')
  async updatePlatformSetting(
    @Param('settingKey') settingKey: string,
    @Body() setting: UpdatePlatformSettingDto,
  ) {
    return { message: 'Update platform setting endpoint - to be implemented' };
  }

  @Get('audit/logs')
  async getAuditLogs(@Query() filter: any) {
    return { message: 'Audit logs endpoint - to be implemented' };
  }

  @Get('reports/export')
  async exportReports(@Query() filter: any) {
    return { message: 'Export reports endpoint - to be implemented' };
  }

  @Get('system/alerts')
  async getSystemAlerts() {
    return { message: 'System alerts endpoint - to be implemented' };
  }
}
