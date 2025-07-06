import { User } from './user.entity';
export declare enum RoleType {
    CUSTOMER = "customer",
    SERVICE_PROVIDER = "service_provider",
    ADMIN = "admin"
}
export declare class UserRole {
    id: string;
    userId: string;
    roleType: RoleType;
    isActive: boolean;
    assignedAt: Date;
    user: User;
}
