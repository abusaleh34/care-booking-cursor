import { RoleType } from '../../database/entities/user-role.entity';
export interface AuthenticatedUser {
    id: string;
    email: string;
    isVerified: boolean;
    mfaEnabled: boolean;
    profile?: {
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
    roles: RoleType[];
}
export interface JwtPayload {
    sub: string;
    email?: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        isVerified: boolean;
        mfaEnabled: boolean;
        profile: {
            firstName: string;
            lastName: string;
            avatarUrl?: string;
        };
        roles: RoleType[];
    };
}
