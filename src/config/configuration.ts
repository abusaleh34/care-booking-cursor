import { registerAs } from '@nestjs/config';
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

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
  }),
);

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'careservices',
    password: process.env.DATABASE_PASSWORD || 'careservices123',
    database: process.env.DATABASE_NAME || 'care_services',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  }),
);

export const redisConfig = registerAs(
  'redis',
  (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  }),
);

export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  }),
);

export const emailConfig = registerAs(
  'email',
  (): EmailConfig => ({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@careservices.com',
  }),
);

export const storageConfig = registerAs(
  'storage',
  (): StorageConfig => ({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin123',
    bucket: process.env.S3_BUCKET || 'care-services',
    region: process.env.S3_REGION || 'us-east-1',
  }),
);

export const securityConfig = registerAs(
  'security',
  (): SecurityConfig => ({
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    slowDownWindowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000', 10),
    slowDownDelayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50', 10),
    slowDownDelayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS || '500', 10),
  }),
);

export const monitoringConfig = registerAs(
  'monitoring',
  (): MonitoringConfig => ({
    sentryDsn: process.env.SENTRY_DSN,
    sentryTracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    newRelicEnabled: process.env.NEW_RELIC_ENABLED === 'true',
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  }),
);

export const paymentConfig = registerAs(
  'payment',
  (): PaymentConfig => ({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  }),
);

export const smsConfig = registerAs(
  'sms',
  (): SmsConfig => ({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  }),
);

// Configuration validation schema
export const configValidationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  FRONTEND_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),

  // Database configuration
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // Redis configuration
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  CACHE_TTL: Joi.number().default(3600),

  // JWT configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Email configuration
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASSWORD: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().email().required(),

  // Storage configuration
  S3_ENDPOINT: Joi.string().uri().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_REGION: Joi.string().default('us-east-1'),

  // Security configuration
  BCRYPT_ROUNDS: Joi.number().min(10).max(20).default(10),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  SLOW_DOWN_WINDOW_MS: Joi.number().default(900000),
  SLOW_DOWN_DELAY_AFTER: Joi.number().default(50),
  SLOW_DOWN_DELAY_MS: Joi.number().default(500),

  // Monitoring configuration
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
  PROMETHEUS_ENABLED: Joi.boolean().default(false),
  NEW_RELIC_ENABLED: Joi.boolean().default(false),
  NEW_RELIC_LICENSE_KEY: Joi.string().when('NEW_RELIC_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Payment configuration
  STRIPE_SECRET_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional(),

  // SMS configuration
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_PHONE_NUMBER: Joi.string().optional(),
});

// Export all configurations
export default [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  emailConfig,
  storageConfig,
  securityConfig,
  monitoringConfig,
  paymentConfig,
  smsConfig,
];
