"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configValidationSchema = exports.smsConfig = exports.paymentConfig = exports.monitoringConfig = exports.securityConfig = exports.storageConfig = exports.emailConfig = exports.jwtConfig = exports.redisConfig = exports.databaseConfig = exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
const Joi = require("joi");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
    ],
}));
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'careservices',
    password: process.env.DATABASE_PASSWORD || 'careservices123',
    database: process.env.DATABASE_NAME || 'care_services',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
}));
exports.redisConfig = (0, config_1.registerAs)('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
}));
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => ({
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
exports.emailConfig = (0, config_1.registerAs)('email', () => ({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@careservices.com',
}));
exports.storageConfig = (0, config_1.registerAs)('storage', () => ({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin123',
    bucket: process.env.S3_BUCKET || 'care-services',
    region: process.env.S3_REGION || 'us-east-1',
}));
exports.securityConfig = (0, config_1.registerAs)('security', () => ({
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    slowDownWindowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000', 10),
    slowDownDelayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50', 10),
    slowDownDelayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS || '500', 10),
}));
exports.monitoringConfig = (0, config_1.registerAs)('monitoring', () => ({
    sentryDsn: process.env.SENTRY_DSN,
    sentryTracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    newRelicEnabled: process.env.NEW_RELIC_ENABLED === 'true',
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
}));
exports.paymentConfig = (0, config_1.registerAs)('payment', () => ({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
}));
exports.smsConfig = (0, config_1.registerAs)('sms', () => ({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
}));
exports.configValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    HOST: Joi.string().default('0.0.0.0'),
    FRONTEND_URL: Joi.string().uri().required(),
    CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5432),
    DATABASE_USER: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    CACHE_TTL: Joi.number().default(3600),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().default(587),
    EMAIL_USER: Joi.string().allow('').optional(),
    EMAIL_PASSWORD: Joi.string().allow('').optional(),
    EMAIL_FROM: Joi.string().email().required(),
    S3_ENDPOINT: Joi.string().uri().required(),
    S3_ACCESS_KEY: Joi.string().required(),
    S3_SECRET_KEY: Joi.string().required(),
    S3_BUCKET: Joi.string().required(),
    S3_REGION: Joi.string().default('us-east-1'),
    BCRYPT_ROUNDS: Joi.number().min(10).max(20).default(10),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX: Joi.number().default(100),
    SLOW_DOWN_WINDOW_MS: Joi.number().default(900000),
    SLOW_DOWN_DELAY_AFTER: Joi.number().default(50),
    SLOW_DOWN_DELAY_MS: Joi.number().default(500),
    SENTRY_DSN: Joi.string().uri().optional(),
    SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
    PROMETHEUS_ENABLED: Joi.boolean().default(false),
    NEW_RELIC_ENABLED: Joi.boolean().default(false),
    NEW_RELIC_LICENSE_KEY: Joi.string().when('NEW_RELIC_ENABLED', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    STRIPE_SECRET_KEY: Joi.string().when('NODE_ENV', {
        is: 'production',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
    STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),
    TWILIO_ACCOUNT_SID: Joi.string().optional(),
    TWILIO_AUTH_TOKEN: Joi.string().optional(),
    TWILIO_PHONE_NUMBER: Joi.string().optional(),
});
exports.default = [
    exports.appConfig,
    exports.databaseConfig,
    exports.redisConfig,
    exports.jwtConfig,
    exports.emailConfig,
    exports.storageConfig,
    exports.securityConfig,
    exports.monitoringConfig,
    exports.paymentConfig,
    exports.smsConfig,
];
//# sourceMappingURL=configuration.js.map