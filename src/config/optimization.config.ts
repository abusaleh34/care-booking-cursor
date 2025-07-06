import { registerAs } from '@nestjs/config';

export default registerAs('optimization', () => ({
  // Performance Settings
  performance: {
    compression: {
      enabled: process.env.COMPRESSION_ENABLED === 'true',
      level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
      threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
      skipFailedRequests: false,
    },
    slowDown: {
      windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000'),
      delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50'),
      delayMs: parseInt(process.env.SLOW_DOWN_DELAY_MS || '500'),
    },
    pagination: {
      defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT || '20'),
      maxLimit: parseInt(process.env.MAX_PAGE_LIMIT || '100'),
    },
  },

  // Caching Strategy
  cache: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'care-services:',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxMemoryPolicy: 'allkeys-lru',
    },
    ttl: {
      searchResults: parseInt(process.env.CACHE_TTL_SEARCH || '900'), // 15 minutes
      providerProfiles: parseInt(process.env.CACHE_TTL_PROVIDER || '3600'), // 1 hour
      serviceCategories: parseInt(process.env.CACHE_TTL_CATEGORIES || '86400'), // 24 hours
      userSessions: parseInt(process.env.CACHE_TTL_SESSION || '3600'), // 1 hour
      availabilityData: parseInt(process.env.CACHE_TTL_AVAILABILITY || '300'), // 5 minutes
      dashboardMetrics: parseInt(process.env.CACHE_TTL_DASHBOARD || '300'), // 5 minutes
      staticContent: parseInt(process.env.CACHE_TTL_STATIC || '604800'), // 7 days
    },
    prefixes: {
      search: 'search:',
      provider: 'provider:',
      category: 'category:',
      session: 'session:',
      availability: 'availability:',
      dashboard: 'dashboard:',
      static: 'static:',
    },
  },

  // Database Optimization
  database: {
    connectionPool: {
      min: parseInt(process.env.DB_POOL_MIN || '5'),
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
      timeout: parseInt(process.env.DB_TIMEOUT || '5000'),
    },
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
    logging: process.env.NODE_ENV === 'development',
    synchronize: process.env.NODE_ENV === 'development',
    migrationsRun: process.env.NODE_ENV === 'production',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },

  // Background Jobs
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_QUEUE_DB || '1'),
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    concurrency: {
      email: parseInt(process.env.QUEUE_EMAIL_CONCURRENCY || '10'),
      sms: parseInt(process.env.QUEUE_SMS_CONCURRENCY || '5'),
      analytics: parseInt(process.env.QUEUE_ANALYTICS_CONCURRENCY || '3'),
      reports: parseInt(process.env.QUEUE_REPORTS_CONCURRENCY || '2'),
      cleanup: parseInt(process.env.QUEUE_CLEANUP_CONCURRENCY || '1'),
    },
  },

  // Monitoring & APM
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      debug: process.env.NODE_ENV === 'development',
    },
    newrelic: {
      enabled: process.env.NEW_RELIC_ENABLED === 'true',
      appName: process.env.NEW_RELIC_APP_NAME || 'Care Services Backend',
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
    },
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000'), // 10 seconds
      retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
    },
  },

  // Security
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
    brute: {
      freeRetries: parseInt(process.env.BRUTE_FREE_RETRIES || '5'),
      minWait: parseInt(process.env.BRUTE_MIN_WAIT || '5000'), // 5 seconds
      maxWait: parseInt(process.env.BRUTE_MAX_WAIT || '900000'), // 15 minutes
      lifetime: parseInt(process.env.BRUTE_LIFETIME || '3600000'), // 1 hour
    },
  },

  // File Upload & Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // 'local', 'aws', 'gcp'
    local: {
      uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILENAME,
      bucket: process.env.GCP_STORAGE_BUCKET,
    },
    cdn: {
      enabled: process.env.CDN_ENABLED === 'true',
      baseUrl: process.env.CDN_BASE_URL,
    },
    imageOptimization: {
      enabled: process.env.IMAGE_OPTIMIZATION_ENABLED === 'true',
      quality: parseInt(process.env.IMAGE_QUALITY || '80'),
      formats: ['jpeg', 'png', 'webp'],
      sizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 },
      },
    },
  },

  // Third-party Integrations
  integrations: {
    google: {
      analytics: {
        enabled: process.env.GOOGLE_ANALYTICS_ENABLED === 'true',
        measurementId: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID,
        apiSecret: process.env.GOOGLE_ANALYTICS_API_SECRET,
      },
      oauth: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      maps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
        enabled: process.env.GOOGLE_MAPS_ENABLED === 'true',
      },
    },
    facebook: {
      oauth: {
        appId: process.env.FACEBOOK_APP_ID,
        appSecret: process.env.FACEBOOK_APP_SECRET,
      },
    },
    mixpanel: {
      enabled: process.env.MIXPANEL_ENABLED === 'true',
      token: process.env.MIXPANEL_TOKEN,
    },
    datadog: {
      enabled: process.env.DATADOG_ENABLED === 'true',
      apiKey: process.env.DATADOG_API_KEY,
      appKey: process.env.DATADOG_APP_KEY,
    },
  },

  // Performance Thresholds
  thresholds: {
    apiResponseTime: {
      p50: parseInt(process.env.THRESHOLD_API_P50 || '100'), // 100ms
      p95: parseInt(process.env.THRESHOLD_API_P95 || '200'), // 200ms
      p99: parseInt(process.env.THRESHOLD_API_P99 || '500'), // 500ms
    },
    databaseQuery: {
      slow: parseInt(process.env.THRESHOLD_DB_SLOW || '1000'), // 1 second
      critical: parseInt(process.env.THRESHOLD_DB_CRITICAL || '5000'), // 5 seconds
    },
    cacheHitRate: {
      warning: parseFloat(process.env.THRESHOLD_CACHE_WARNING || '0.7'), // 70%
      critical: parseFloat(process.env.THRESHOLD_CACHE_CRITICAL || '0.5'), // 50%
    },
    errorRate: {
      warning: parseFloat(process.env.THRESHOLD_ERROR_WARNING || '0.01'), // 1%
      critical: parseFloat(process.env.THRESHOLD_ERROR_CRITICAL || '0.05'), // 5%
    },
  },
}));
