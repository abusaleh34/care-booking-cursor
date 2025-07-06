import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUserManagementService } from './services/admin-user-management.service';
import { AdminDashboardFilterDto, BulkUserActionDto, CommissionConfigDto, ContentModerationActionDto, ContentModerationFilterDto, CreateAdminUserDto, DisputeAssignmentDto, DisputeFilterDto, DisputeResolutionDto, FinancialReportFilterDto, PayoutProcessingDto, PlatformSettingDto, UpdateAdminUserDto, UpdatePlatformSettingDto, UserManagementFilterDto, VerificationReviewDto } from './dto/admin.dto';
export declare class AdminController {
    private readonly dashboardService;
    private readonly userManagementService;
    constructor(dashboardService: AdminDashboardService, userManagementService: AdminUserManagementService);
    getDashboard(filter: AdminDashboardFilterDto): Promise<{
        platformMetrics: {
            totalUsers: number;
            totalProviders: number;
            totalBookings: number;
            activeUsers: number;
            completedBookings: number;
            providerToUserRatio: number;
            completionRate: number;
        };
        userMetrics: {
            newUsers: number;
            newProviders: number;
            verifiedProviders: number;
            suspendedUsers: number;
            verificationRate: number;
        };
        bookingMetrics: {
            total: number;
            completed: number;
            cancelled: number;
            pending: number;
            averageValue: number;
            completionRate: number;
            cancellationRate: number;
        };
        financialMetrics: {
            totalRevenue: number;
            totalCommission: number;
            totalPayouts: number;
            refundCount: number;
            refundAmount: number;
            netRevenue: number;
        };
        recentActivity: ({
            type: string;
            id: string;
            description: string;
            user: string;
            timestamp: Date;
            status: import("../database/entities").BookingStatus;
        } | {
            type: string;
            id: string;
            description: string;
            user: string;
            timestamp: Date;
            status: import("../database/entities").DisputeStatus;
        })[];
        generatedAt: Date;
    }>;
    getGrowthAnalytics(filter: AdminDashboardFilterDto): Promise<{
        userGrowth: any[];
        providerGrowth: any[];
        bookingGrowth: any[];
        revenueGrowth: any[];
        timeframe: "daily" | "weekly" | "monthly" | "yearly";
        period: {
            startDate: string;
            endDate: string;
        };
    }>;
    getSystemHealth(): Promise<{
        status: string;
        pendingDisputes: number;
        pendingVerifications: number;
        systemAlerts: any[];
        lastChecked: Date;
    }>;
    getFinancialOverview(filter: AdminDashboardFilterDto): Promise<{
        revenue: {
            total: number;
        };
        commissions: {
            total: number;
        };
        payouts: {
            total: number;
        };
        refunds: {
            total: number;
        };
        netRevenue: number;
        platformCommission: number;
        topProviders: any[];
        topCategories: any[];
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    createAdminUser(req: any, createAdminDto: CreateAdminUserDto): Promise<any>;
    getAdminUsers(filter: UserManagementFilterDto): Promise<{
        data: import("../database/entities").AdminUser[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateAdminUser(adminId: string, updateDto: UpdateAdminUserDto): Promise<import("../database/entities").AdminUser>;
    getUsers(filter: UserManagementFilterDto): Promise<{
        data: import("../database/entities").User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(userId: string): Promise<import("../database/entities").User>;
    suspendUser(req: any, userId: string, reason: string): Promise<{
        message: string;
    }>;
    activateUser(req: any, userId: string): Promise<{
        message: string;
    }>;
    deleteUser(req: any, userId: string): Promise<{
        message: string;
    }>;
    performBulkUserAction(req: any, bulkAction: BulkUserActionDto): Promise<{
        message: string;
        results: any[];
        totalProcessed: number;
        successful: number;
        failed: number;
    }>;
    getProviderVerifications(filter: any): Promise<{
        data: import("../database/entities").ProviderVerification[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            totalPages: number;
        };
    }>;
    reviewProviderVerification(req: any, verificationId: string, reviewDto: VerificationReviewDto): Promise<import("../database/entities").ProviderVerification>;
    getDisputes(filter: DisputeFilterDto): Promise<{
        message: string;
    }>;
    assignDispute(disputeId: string, assignment: DisputeAssignmentDto): Promise<{
        message: string;
    }>;
    resolveDispute(disputeId: string, resolution: DisputeResolutionDto): Promise<{
        message: string;
    }>;
    getContentForModeration(filter: ContentModerationFilterDto): Promise<{
        message: string;
    }>;
    moderateContent(contentId: string, action: ContentModerationActionDto): Promise<{
        message: string;
    }>;
    getCommissionConfig(): Promise<{
        message: string;
    }>;
    updateCommissionConfig(config: CommissionConfigDto): Promise<{
        message: string;
    }>;
    processPayouts(payout: PayoutProcessingDto): Promise<{
        message: string;
    }>;
    getFinancialReports(filter: FinancialReportFilterDto): Promise<{
        message: string;
    }>;
    getPlatformSettings(): Promise<{
        message: string;
    }>;
    createPlatformSetting(setting: PlatformSettingDto): Promise<{
        message: string;
    }>;
    updatePlatformSetting(settingKey: string, setting: UpdatePlatformSettingDto): Promise<{
        message: string;
    }>;
    getAuditLogs(filter: any): Promise<{
        message: string;
    }>;
    exportReports(filter: any): Promise<{
        message: string;
    }>;
    getSystemAlerts(): Promise<{
        message: string;
    }>;
}
