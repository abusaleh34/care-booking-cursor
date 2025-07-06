import { User } from './user.entity';
export declare class RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    revokedAt: Date;
    user: User;
    get isExpired(): boolean;
    get isValid(): boolean;
}
