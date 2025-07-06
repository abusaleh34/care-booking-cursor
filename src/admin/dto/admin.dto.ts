import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminLevel } from '../../database/entities/admin-user.entity';
import { VerificationStatus } from '../../database/entities/provider-verification.entity';
import { DisputeStatus } from '../../database/entities/dispute.entity';

// Admin User Management DTOs
export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(AdminLevel)
  adminLevel: AdminLevel;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(AdminLevel)
  adminLevel?: AdminLevel;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Dashboard Analytics DTOs
export class AdminDashboardFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// User Management DTOs
export class UserManagementFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userType?: 'customer' | 'provider' | 'admin';

  @IsOptional()
  @IsString()
  status?: 'active' | 'suspended' | 'pending';

  @IsOptional()
  @IsDateString()
  registeredAfter?: string;

  @IsOptional()
  @IsDateString()
  registeredBefore?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class BulkUserActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsString()
  action: 'activate' | 'suspend' | 'delete' | 'verify';

  @IsOptional()
  @IsString()
  reason?: string;
}

// Provider Verification DTOs
export class ProviderVerificationDto {
  @IsUUID()
  providerId: string;

  @IsString()
  verificationType: string;

  @IsArray()
  documents: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerificationReviewDto {
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Dispute Management DTOs
export class DisputeFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsString()
  disputeType?: string;

  @IsOptional()
  @IsUUID()
  assignedAdminId?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DisputeAssignmentDto {
  @IsUUID()
  adminId: string;
}

export class DisputeResolutionDto {
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @IsString()
  resolution: string;
}

// Financial Management DTOs
export class CommissionConfigDto {
  @IsUUID()
  categoryId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PayoutProcessingDto {
  @IsUUID()
  providerId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FinancialReportFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reportType?: 'revenue' | 'commission' | 'payouts' | 'refunds';

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

// Platform Settings DTOs
export class PlatformSettingDto {
  @IsString()
  settingKey: string;

  @IsObject()
  settingValue: Record<string, any>;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePlatformSettingDto {
  @IsObject()
  settingValue: Record<string, any>;

  @IsOptional()
  @IsString()
  description?: string;
}

// Content Moderation DTOs
export class ContentModerationFilterDto {
  @IsOptional()
  @IsString()
  contentType?: 'review' | 'profile' | 'service' | 'image';

  @IsOptional()
  @IsString()
  status?: 'pending' | 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  reportedAfter?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ContentModerationActionDto {
  @IsString()
  action: 'approve' | 'reject' | 'flag' | 'remove';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
