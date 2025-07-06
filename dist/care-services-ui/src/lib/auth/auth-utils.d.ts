export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles: string[];
    phone?: string;
    isVerified?: boolean;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
export declare const setAuthToken: (token: string) => void;
export declare const getAuthToken: () => string | null;
export declare const removeAuthToken: () => void;
export declare const setRefreshToken: (token: string) => void;
export declare const getRefreshToken: () => string | null;
export declare const removeRefreshToken: () => void;
export declare const setUser: (user: User) => void;
export declare const getUser: () => User | null;
export declare const removeUser: () => void;
export declare const saveAuth: (authData: AuthResponse) => void;
export declare const clearAuth: () => void;
export declare const isAuthenticated: () => boolean;
export declare const hasRole: (role: string) => boolean;
export declare const isCustomer: () => boolean;
export declare const isProvider: () => boolean;
export declare const isAdmin: () => boolean;
