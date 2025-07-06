import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // Replace express-brute with express-rate-limit configuration
  rateLimiting: {
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'), // 5 attempts per window
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many authentication attempts, please try again later',
        retryAfter: 900000,
      },
    },
    api: {
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || '60000'), // 1 minute
      max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'), // 100 requests per minute
      standardHeaders: true,
      legacyHeaders: false,
    },
    payments: {
      windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW || '300000'), // 5 minutes
      max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '10'), // 10 payment attempts per 5 minutes
      standardHeaders: true,
      legacyHeaders: false,
    },
  },

  // Content Security Policy
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

  // CORS Configuration
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
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // Session Security
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '3600000'), // 1 hour
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },

  // Password Policy
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

  // Account Lockout Policy
  accountLockout: {
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    resetOnSuccess: true,
    progressiveDelay: true, // Increase delay with each failed attempt
  },

  // JWT Security
  jwt: {
    accessTokenExpiry: process.env.JWT_EXPIRATION || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'care-services',
    audience: process.env.JWT_AUDIENCE || 'care-services-api',
    algorithm: 'HS256',
    clockTolerance: 30, // seconds
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    sanitizeFilenames: true,
    virusScan: process.env.NODE_ENV === 'production',
  },

  // API Security Headers
  headers: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  },
}));
