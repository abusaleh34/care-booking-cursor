import { User } from './user.entity';
export declare class MfaSecret {
    id: string;
    userId: string;
    secret: string;
    backupCodes: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
