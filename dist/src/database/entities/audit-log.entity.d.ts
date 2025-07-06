import { User } from './user.entity';
export declare enum AuditAction {
    LOGIN = "login",
    LOGOUT = "logout",
    REGISTER = "register",
    PASSWORD_CHANGE = "password_change",
    PASSWORD_RESET = "password_reset",
    EMAIL_VERIFICATION = "email_verification",
    PHONE_VERIFICATION = "phone_verification",
    MFA_ENABLE = "mfa_enable",
    MFA_DISABLE = "mfa_disable",
    PROFILE_UPDATE = "profile_update",
    ACCOUNT_LOCK = "account_lock",
    ACCOUNT_UNLOCK = "account_unlock",
    FAILED_LOGIN = "failed_login",
    TOKEN_REFRESH = "token_refresh",
    TOKEN_REVOKE = "token_revoke"
}
export declare class AuditLog {
    id: string;
    userId: string;
    action: AuditAction;
    description: string;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, any>;
    isSuspicious: boolean;
    createdAt: Date;
    user: User;
}
