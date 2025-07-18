import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import * as express from 'express';
import { join } from 'path';

// Monitoring imports (conditional)
let Sentry: any;
let register: any;

try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Sentry not available
}

try {
  const promClient = require('prom-client');
  register = promClient.register;
} catch (e) {
  // Prometheus client not available
}

// App imports
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize New Relic if configured (must be first)
  if (process.env.NEW_RELIC_ENABLED === 'true' && process.env.NEW_RELIC_LICENSE_KEY) {
    try {
      require('newrelic');
      logger.log('New Relic APM initialized');
    } catch (e) {
      logger.warn('New Relic initialization failed');
    }
  }

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Get configuration service
  const configService = app.get(ConfigService);

  // Initialize Sentry if available and configured
  if (Sentry && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: app.getHttpAdapter().getInstance() }),
      ],
    });

    // RequestHandler creates a separate execution context using domains
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    logger.log('Sentry error tracking initialized');
  }

  // Security middleware
  try {
    app.use(
      helmet({
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
      }),
    );
    logger.log('Security headers configured');
  } catch (e) {
    logger.warn('Helmet security headers not available');
  }

  // CORS configuration
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGINS?.split(',') || ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
  logger.log('CORS configured');

  // Compression middleware
  if (process.env.COMPRESSION_ENABLED !== 'false') {
    try {
      app.use(
        compression({
          level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
          threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
          filter: (req, res) => {
            if (req.headers['x-no-compression']) {
              return false;
            }
            return compression.filter(req, res);
          },
        }),
      );
      logger.log('Response compression enabled');
    } catch (e) {
      logger.warn('Compression middleware not available');
    }
  }

  // Rate limiting
  try {
    const rateLimitMiddleware = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/metrics';
      },
    });
    app.use(rateLimitMiddleware);
    logger.log('Rate limiting configured');
  } catch (e) {
    logger.warn('Rate limiting not available');
  }

  // Slow down middleware
  try {
    const slowDownMiddleware = slowDown({
      windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000'),
      delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50'),
      delayMs: () => 500, // Use function to return fixed delay
      skip: (req) => {
        return req.path === '/health' || req.path === '/metrics';
      },
      validate: {
        delayMs: false, // Disable warning
      },
    });
    app.use(slowDownMiddleware);
    logger.log('Slow down protection configured');
  } catch (e) {
    logger.warn('Slow down middleware not available');
  }

  // Body parsing limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  logger.log('Global validation configured');

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/dashboard', '/admin', '/', '/health', '/metrics', '/login', '/demo-login.html'],
  });

  // Swagger documentation (development only)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('Care Services API')
        .setDescription('Care Services Platform - Complete marketplace for self-care services')
        .setVersion('5.0.0')
        .addBearerAuth()
        .addTag('Authentication', 'User authentication and authorization')
        .addTag('Customer', 'Customer booking and service discovery')
        .addTag('Provider', 'Service provider management and operations')
        .addTag('Admin', 'Platform administration and analytics')
        .addTag('Health', 'System health and monitoring')
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          docExpansion: 'none',
          filter: true,
          showRequestDuration: true,
        },
      });
      logger.log('Swagger documentation available at /api/docs');
    } catch (e) {
      logger.warn('Swagger documentation not available');
    }
  }

  // Health check endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', async (req, res) => {
    try {
      const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '5.0.0',
        memory: process.memoryUsage(),
        pid: process.pid,
      };
      res.status(200).json(healthCheck);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // Metrics endpoint for Prometheus
  if (register && process.env.PROMETHEUS_ENABLED === 'true') {
    expressApp.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).json({ error: 'Metrics not available' });
      }
    });
    logger.log('Prometheus metrics available at /metrics');
  }

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);

    setTimeout(() => {
      logger.error('Forceful shutdown due to timeout');
      process.exit(1);
    }, 30000); // 30 seconds timeout

    app
      .close()
      .then(() => {
        logger.log('Application closed successfully');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      });
  };

  // Register shutdown handlers
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    if (Sentry && process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (Sentry && process.env.SENTRY_DSN) {
      Sentry.captureException(new Error(`Unhandled Rejection: ${reason}`));
    }
  });

  // Sentry error handler (must be before any other error middleware)
  if (Sentry && process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // Start the server
  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  // Log startup information
  logger.log(`🚀 Care Services Platform started successfully!`);
  logger.log(`📱 Application running on: http://${host}:${port}/api/v1`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📊 Health check: http://${host}:${port}/health`);

  if (register && process.env.PROMETHEUS_ENABLED === 'true') {
    logger.log(`📈 Metrics: http://${host}:${port}/metrics`);
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📚 API Documentation: http://${host}:${port}/api/docs`);
  }

  // Performance monitoring
  const memoryUsage = process.memoryUsage();
  logger.log(`💾 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap used`);
  logger.log(`⏱️  Startup time: ${process.uptime().toFixed(2)}s`);

  // Log feature flags
  logger.log('🔧 Feature flags:');
  logger.log(`  - Compression: ${process.env.COMPRESSION_ENABLED !== 'false' ? '✅' : '❌'}`);
  logger.log(`  - Rate limiting: ✅`);
  logger.log(`  - Monitoring: ${process.env.MONITORING_ENABLED === 'true' ? '✅' : '❌'}`);
  logger.log(`  - Sentry: ${process.env.SENTRY_DSN ? '✅' : '❌'}`);
  logger.log(`  - Prometheus: ${process.env.PROMETHEUS_ENABLED === 'true' ? '✅' : '❌'}`);
  logger.log(`  - New Relic: ${process.env.NEW_RELIC_ENABLED === 'true' ? '✅' : '❌'}`);

  // Production deployment verification
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_PASSWORD', 'JWT_SECRET', 'REDIS_HOST'];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
      logger.error('Application may not function properly in production');
    } else {
      logger.log('✅ All required environment variables are set');
    }

    // Verify external service connections
    logger.log('🔍 External services configured:');
    logger.log(`  - Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
    logger.log(`  - Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
    logger.log(`  - Email: ${process.env.EMAIL_HOST ? '✅' : '❌'}`);
  }

  return app;
}

// Only start the server if this file is executed directly
if (require.main === module) {
  bootstrap().catch((error) => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application:', error);

    // Send error to monitoring if available
    if (Sentry && process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    process.exit(1);
  });
}
