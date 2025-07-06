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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentModerationActionDto = exports.ContentModerationFilterDto = exports.UpdatePlatformSettingDto = exports.PlatformSettingDto = exports.FinancialReportFilterDto = exports.PayoutProcessingDto = exports.CommissionConfigDto = exports.DisputeResolutionDto = exports.DisputeAssignmentDto = exports.DisputeFilterDto = exports.VerificationReviewDto = exports.ProviderVerificationDto = exports.BulkUserActionDto = exports.UserManagementFilterDto = exports.AdminDashboardFilterDto = exports.UpdateAdminUserDto = exports.CreateAdminUserDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const admin_user_entity_1 = require("../../database/entities/admin-user.entity");
const provider_verification_entity_1 = require("../../database/entities/provider-verification.entity");
const dispute_entity_1 = require("../../database/entities/dispute.entity");
class CreateAdminUserDto {
}
exports.CreateAdminUserDto = CreateAdminUserDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(admin_user_entity_1.AdminLevel),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "adminLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAdminUserDto.prototype, "permissions", void 0);
class UpdateAdminUserDto {
}
exports.UpdateAdminUserDto = UpdateAdminUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(admin_user_entity_1.AdminLevel),
    __metadata("design:type", String)
], UpdateAdminUserDto.prototype, "adminLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateAdminUserDto.prototype, "permissions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAdminUserDto.prototype, "isActive", void 0);
class AdminDashboardFilterDto {
}
exports.AdminDashboardFilterDto = AdminDashboardFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminDashboardFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminDashboardFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminDashboardFilterDto.prototype, "timeframe", void 0);
class UserManagementFilterDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.UserManagementFilterDto = UserManagementFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserManagementFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserManagementFilterDto.prototype, "userType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserManagementFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserManagementFilterDto.prototype, "registeredAfter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UserManagementFilterDto.prototype, "registeredBefore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UserManagementFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UserManagementFilterDto.prototype, "limit", void 0);
class BulkUserActionDto {
}
exports.BulkUserActionDto = BulkUserActionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkUserActionDto.prototype, "userIds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkUserActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkUserActionDto.prototype, "reason", void 0);
class ProviderVerificationDto {
}
exports.ProviderVerificationDto = ProviderVerificationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProviderVerificationDto.prototype, "providerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProviderVerificationDto.prototype, "verificationType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ProviderVerificationDto.prototype, "documents", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProviderVerificationDto.prototype, "notes", void 0);
class VerificationReviewDto {
}
exports.VerificationReviewDto = VerificationReviewDto;
__decorate([
    (0, class_validator_1.IsEnum)(provider_verification_entity_1.VerificationStatus),
    __metadata("design:type", String)
], VerificationReviewDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerificationReviewDto.prototype, "notes", void 0);
class DisputeFilterDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.DisputeFilterDto = DisputeFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(dispute_entity_1.DisputeStatus),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "disputeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "assignedAdminId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "createdAfter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DisputeFilterDto.prototype, "createdBefore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DisputeFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DisputeFilterDto.prototype, "limit", void 0);
class DisputeAssignmentDto {
}
exports.DisputeAssignmentDto = DisputeAssignmentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DisputeAssignmentDto.prototype, "adminId", void 0);
class DisputeResolutionDto {
}
exports.DisputeResolutionDto = DisputeResolutionDto;
__decorate([
    (0, class_validator_1.IsEnum)(dispute_entity_1.DisputeStatus),
    __metadata("design:type", String)
], DisputeResolutionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DisputeResolutionDto.prototype, "resolution", void 0);
class CommissionConfigDto {
}
exports.CommissionConfigDto = CommissionConfigDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CommissionConfigDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CommissionConfigDto.prototype, "commissionRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CommissionConfigDto.prototype, "description", void 0);
class PayoutProcessingDto {
}
exports.PayoutProcessingDto = PayoutProcessingDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PayoutProcessingDto.prototype, "providerId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PayoutProcessingDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayoutProcessingDto.prototype, "notes", void 0);
class FinancialReportFilterDto {
}
exports.FinancialReportFilterDto = FinancialReportFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FinancialReportFilterDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FinancialReportFilterDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FinancialReportFilterDto.prototype, "reportType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FinancialReportFilterDto.prototype, "providerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FinancialReportFilterDto.prototype, "categoryId", void 0);
class PlatformSettingDto {
}
exports.PlatformSettingDto = PlatformSettingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlatformSettingDto.prototype, "settingKey", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PlatformSettingDto.prototype, "settingValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PlatformSettingDto.prototype, "description", void 0);
class UpdatePlatformSettingDto {
}
exports.UpdatePlatformSettingDto = UpdatePlatformSettingDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdatePlatformSettingDto.prototype, "settingValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePlatformSettingDto.prototype, "description", void 0);
class ContentModerationFilterDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.ContentModerationFilterDto = ContentModerationFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationFilterDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationFilterDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ContentModerationFilterDto.prototype, "reportedAfter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ContentModerationFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ContentModerationFilterDto.prototype, "limit", void 0);
class ContentModerationActionDto {
}
exports.ContentModerationActionDto = ContentModerationActionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationActionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentModerationActionDto.prototype, "notes", void 0);
//# sourceMappingURL=admin.dto.js.map