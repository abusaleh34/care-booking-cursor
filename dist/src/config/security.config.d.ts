declare const _default: (() => {
    rateLimiting: {
        auth: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
            message: {
                error: string;
                retryAfter: number;
            };
        };
        api: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        payments: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
    };
    csp: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            fontSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            frameSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            workerSrc: string[];
            childSrc: string[];
            formAction: string[];
            upgradeInsecureRequests: boolean;
        };
    };
    cors: {
        origin: string[];
        methods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
        preflightContinue: boolean;
        optionsSuccessStatus: number;
    };
    session: {
        secure: boolean;
        httpOnly: boolean;
        maxAge: number;
        sameSite: string;
    };
    password: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxLength: number;
        preventCommonPasswords: boolean;
        preventUserInfoInPassword: boolean;
    };
    accountLockout: {
        maxFailedAttempts: number;
        lockoutDuration: number;
        resetOnSuccess: boolean;
        progressiveDelay: boolean;
    };
    jwt: {
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
        issuer: string;
        audience: string;
        algorithm: string;
        clockTolerance: number;
    };
    fileUpload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        sanitizeFilenames: boolean;
        virusScan: boolean;
    };
    headers: {
        xFrameOptions: string;
        xContentTypeOptions: string;
        xXssProtection: string;
        referrerPolicy: string;
        permissionsPolicy: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    rateLimiting: {
        auth: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
            message: {
                error: string;
                retryAfter: number;
            };
        };
        api: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
        payments: {
            windowMs: number;
            max: number;
            standardHeaders: boolean;
            legacyHeaders: boolean;
        };
    };
    csp: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            fontSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            frameSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            workerSrc: string[];
            childSrc: string[];
            formAction: string[];
            upgradeInsecureRequests: boolean;
        };
    };
    cors: {
        origin: string[];
        methods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
        preflightContinue: boolean;
        optionsSuccessStatus: number;
    };
    session: {
        secure: boolean;
        httpOnly: boolean;
        maxAge: number;
        sameSite: string;
    };
    password: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxLength: number;
        preventCommonPasswords: boolean;
        preventUserInfoInPassword: boolean;
    };
    accountLockout: {
        maxFailedAttempts: number;
        lockoutDuration: number;
        resetOnSuccess: boolean;
        progressiveDelay: boolean;
    };
    jwt: {
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
        issuer: string;
        audience: string;
        algorithm: string;
        clockTolerance: number;
    };
    fileUpload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        sanitizeFilenames: boolean;
        virusScan: boolean;
    };
    headers: {
        xFrameOptions: string;
        xContentTypeOptions: string;
        xXssProtection: string;
        referrerPolicy: string;
        permissionsPolicy: string;
    };
}>;
export default _default;
