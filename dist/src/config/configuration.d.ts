import * as Joi from 'joi';
export interface AppConfig {
    nodeEnv: string;
    port: number;
    host: string;
    frontendUrl: string;
    corsOrigins: string[];
}
export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean;
}
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    ttl: number;
}
export interface JwtConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
}
export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    from: string;
}
export interface StorageConfig {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
}
export interface SecurityConfig {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMax: number;
    slowDownWindowMs: number;
    slowDownDelayAfter: number;
    slowDownDelayMs: number;
}
export interface MonitoringConfig {
    sentryDsn?: string;
    sentryTracesSampleRate: number;
    prometheusEnabled: boolean;
    newRelicEnabled: boolean;
    newRelicLicenseKey?: string;
}
export interface PaymentConfig {
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    stripePublishableKey: string;
}
export interface SmsConfig {
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
}
export declare const appConfig: (() => AppConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfig>;
export declare const databaseConfig: (() => DatabaseConfig) & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig>;
export declare const redisConfig: (() => RedisConfig) & import("@nestjs/config").ConfigFactoryKeyHost<RedisConfig>;
export declare const jwtConfig: (() => JwtConfig) & import("@nestjs/config").ConfigFactoryKeyHost<JwtConfig>;
export declare const emailConfig: (() => EmailConfig) & import("@nestjs/config").ConfigFactoryKeyHost<EmailConfig>;
export declare const storageConfig: (() => StorageConfig) & import("@nestjs/config").ConfigFactoryKeyHost<StorageConfig>;
export declare const securityConfig: (() => SecurityConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SecurityConfig>;
export declare const monitoringConfig: (() => MonitoringConfig) & import("@nestjs/config").ConfigFactoryKeyHost<MonitoringConfig>;
export declare const paymentConfig: (() => PaymentConfig) & import("@nestjs/config").ConfigFactoryKeyHost<PaymentConfig>;
export declare const smsConfig: (() => SmsConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SmsConfig>;
export declare const configValidationSchema: Joi.ObjectSchema<any>;
declare const _default: (((() => AppConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AppConfig>) | ((() => DatabaseConfig) & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig>) | ((() => RedisConfig) & import("@nestjs/config").ConfigFactoryKeyHost<RedisConfig>) | ((() => JwtConfig) & import("@nestjs/config").ConfigFactoryKeyHost<JwtConfig>) | ((() => EmailConfig) & import("@nestjs/config").ConfigFactoryKeyHost<EmailConfig>) | ((() => StorageConfig) & import("@nestjs/config").ConfigFactoryKeyHost<StorageConfig>) | ((() => SecurityConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SecurityConfig>) | ((() => MonitoringConfig) & import("@nestjs/config").ConfigFactoryKeyHost<MonitoringConfig>) | ((() => PaymentConfig) & import("@nestjs/config").ConfigFactoryKeyHost<PaymentConfig>) | ((() => SmsConfig) & import("@nestjs/config").ConfigFactoryKeyHost<SmsConfig>))[];
export default _default;
