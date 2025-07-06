import { AdminUser } from './admin-user.entity';
export declare class PlatformSetting {
    id: string;
    settingKey: string;
    settingValue: Record<string, any>;
    description: string;
    updatedById: string;
    updatedBy: AdminUser;
    updatedAt: Date;
}
