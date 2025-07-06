"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('security', () => ({
    rateLimiting: {
        auth: {
            windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'),
            max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                error: 'Too many authentication attempts, please try again later',
                retryAfter: 900000,
            },
        },
        api: {
            windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000'),
            max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
            standardHeaders: true,
            legacyHeaders: false,
        },
        payments: {
            windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW || '300000'),
            max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '10'),
            standardHeaders: true,
            legacyHeaders: false,
        },
    },
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'none'"],
            childSrc: ["'none'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production',
        },
    },
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-API-Key',
            'X-Client-Version',
        ],
        credentials: true,
        maxAge: 86400,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    },
    session: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '3600000'),
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxLength: 128,
        preventCommonPasswords: true,
        preventUserInfoInPassword: true,
    },
    accountLockout: {
        maxFailedAttempts: 5,
        lockoutDuration: 30 * 60 * 1000,
        resetOnSuccess: true,
        progressiveDelay: true,
    },
    jwt: {
        accessTokenExpiry: process.env.JWT_EXPIRATION || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRATION || '7d',
        issuer: process.env.JWT_ISSUER || 'care-services',
        audience: process.env.JWT_AUDIENCE || 'care-services-api',
        algorithm: 'HS256',
        clockTolerance: 30,
    },
    fileUpload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        sanitizeFilenames: true,
        virusScan: process.env.NODE_ENV === 'production',
    },
    headers: {
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXssProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
    },
}));
//# sourceMappingURL=security.config.js.map