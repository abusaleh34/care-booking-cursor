import { AdminLevel } from '../../database/entities/admin-user.entity';
import { VerificationStatus } from '../../database/entities/provider-verification.entity';
import { DisputeStatus } from '../../database/entities/dispute.entity';
export declare class CreateAdminUserDto {
    email: string;
    fullName: string;
    adminLevel: AdminLevel;
    permissions?: Record<string, any>;
}
export declare class UpdateAdminUserDto {
    adminLevel?: AdminLevel;
    permissions?: Record<string, any>;
    isActive?: boolean;
}
export declare class AdminDashboardFilterDto {
    startDate?: string;
    endDate?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
export declare class UserManagementFilterDto {
    search?: string;
    userType?: 'customer' | 'provider' | 'admin';
    status?: 'active' | 'suspended' | 'pending';
    registeredAfter?: string;
    registeredBefore?: string;
    page?: number;
    limit?: number;
}
export declare class BulkUserActionDto {
    userIds: string[];
    action: 'activate' | 'suspend' | 'delete' | 'verify';
    reason?: string;
}
export declare class ProviderVerificationDto {
    providerId: string;
    verificationType: string;
    documents: Array<{
        name: string;
        url: string;
        uploadedAt: Date;
    }>;
    notes?: string;
}
export declare class VerificationReviewDto {
    status: VerificationStatus;
    notes?: string;
}
export declare class DisputeFilterDto {
    search?: string;
    status?: DisputeStatus;
    disputeType?: string;
    assignedAdminId?: string;
    createdAfter?: string;
    createdBefore?: string;
    page?: number;
    limit?: number;
}
export declare class DisputeAssignmentDto {
    adminId: string;
}
export declare class DisputeResolutionDto {
    status: DisputeStatus;
    resolution: string;
}
export declare class CommissionConfigDto {
    categoryId: string;
    commissionRate: number;
    description?: string;
}
export declare class PayoutProcessingDto {
    providerId: string;
    amount: number;
    notes?: string;
}
export declare class FinancialReportFilterDto {
    startDate?: string;
    endDate?: string;
    reportType?: 'revenue' | 'commission' | 'payouts' | 'refunds';
    providerId?: string;
    categoryId?: string;
}
export declare class PlatformSettingDto {
    settingKey: string;
    settingValue: Record<string, any>;
    description?: string;
}
export declare class UpdatePlatformSettingDto {
    settingValue: Record<string, any>;
    description?: string;
}
export declare class ContentModerationFilterDto {
    contentType?: 'review' | 'profile' | 'service' | 'image';
    status?: 'pending' | 'approved' | 'rejected';
    search?: string;
    reportedAfter?: string;
    page?: number;
    limit?: number;
}
export declare class ContentModerationActionDto {
    action: 'approve' | 'reject' | 'flag' | 'remove';
    reason?: string;
    notes?: string;
}
