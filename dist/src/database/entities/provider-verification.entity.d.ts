import { ServiceProvider } from './service-provider.entity';
import { AdminUser } from './admin-user.entity';
export declare enum VerificationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    REQUIRES_INFO = "requires_info"
}
export declare class ProviderVerification {
    id: string;
    providerId: string;
    provider: ServiceProvider;
    adminId: string;
    admin: AdminUser;
    verificationType: string;
    status: VerificationStatus;
    documents: Array<{
        name: string;
        url: string;
        uploadedAt: Date;
    }>;
    notes: string;
    reviewedAt: Date;
    createdAt: Date;
}
