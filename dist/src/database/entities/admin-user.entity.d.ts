import { User } from './user.entity';
import { ProviderVerification } from './provider-verification.entity';
import { Dispute } from './dispute.entity';
import { PlatformSetting } from './platform-setting.entity';
export declare enum AdminLevel {
    SUPER_ADMIN = "super_admin",
    MODERATOR = "moderator",
    SUPPORT = "support",
    FINANCIAL = "financial"
}
export declare class AdminUser {
    id: string;
    userId: string;
    user: User;
    adminLevel: AdminLevel;
    permissions: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    verifications: ProviderVerification[];
    assignedDisputes: Dispute[];
    updatedSettings: PlatformSetting[];
}
