"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const compression = require("compression");
const express_rate_limit_1 = require("express-rate-limit");
const express_slow_down_1 = require("express-slow-down");
const express = require("express");
const path_1 = require("path");
let Sentry;
let register;
try {
    Sentry = require('@sentry/node');
}
catch (e) {
}
try {
    const promClient = require('prom-client');
    register = promClient.register;
}
catch (e) {
}
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    if (process.env.NEW_RELIC_ENABLED === 'true' && process.env.NEW_RELIC_LICENSE_KEY) {
        try {
            require('newrelic');
            logger.log('New Relic APM initialized');
        }
        catch (e) {
            logger.warn('New Relic initialization failed');
        }
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
    const configService = app.get(config_1.ConfigService);
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
        app.use(Sentry.Handlers.requestHandler());
        app.use(Sentry.Handlers.tracingHandler());
        logger.log('Sentry error tracking initialized');
    }
    try {
        app.use((0, helmet_1.default)({
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
        }));
        logger.log('Security headers configured');
    }
    catch (e) {
        logger.warn('Helmet security headers not available');
    }
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? process.env.CORS_ORIGINS?.split(',') || ['https://your-frontend-domain.com']
            : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400,
    });
    logger.log('CORS configured');
    if (process.env.COMPRESSION_ENABLED !== 'false') {
        try {
            app.use(compression({
                level: parseInt(process.env.COMPRESSION_LEVEL || '6'),
                threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024'),
                filter: (req, res) => {
                    if (req.headers['x-no-compression']) {
                        return false;
                    }
                    return compression.filter(req, res);
                },
            }));
            logger.log('Response compression enabled');
        }
        catch (e) {
            logger.warn('Compression middleware not available');
        }
    }
    try {
        const rateLimitMiddleware = (0, express_rate_limit_1.default)({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
            max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
            message: {
                error: 'Too many requests',
                message: 'Please try again later',
                retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                return req.path === '/health' || req.path === '/metrics';
            },
        });
        app.use(rateLimitMiddleware);
        logger.log('Rate limiting configured');
    }
    catch (e) {
        logger.warn('Rate limiting not available');
    }
    try {
        const slowDownMiddleware = (0, express_slow_down_1.default)({
            windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS || '900000'),
            delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER || '50'),
            delayMs: () => 500,
            skip: (req) => {
                return req.path === '/health' || req.path === '/metrics';
            },
            validate: {
                delayMs: false,
            },
        });
        app.use(slowDownMiddleware);
        logger.log('Slow down protection configured');
    }
    catch (e) {
        logger.warn('Slow down middleware not available');
    }
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.useGlobalPipes(new common_1.ValidationPipe({
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
    }));
    logger.log('Global validation configured');
    app.setGlobalPrefix('api/v1', {
        exclude: ['/dashboard', '/admin', '/', '/health', '/metrics', '/login', '/demo-login.html'],
    });
    if (process.env.NODE_ENV !== 'production') {
        try {
            const swaggerConfig = new swagger_1.DocumentBuilder()
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
            const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
            swagger_1.SwaggerModule.setup('api/docs', app, document, {
                swaggerOptions: {
                    persistAuthorization: true,
                    docExpansion: 'none',
                    filter: true,
                    showRequestDuration: true,
                },
            });
            logger.log('Swagger documentation available at /api/docs');
        }
        catch (e) {
            logger.warn('Swagger documentation not available');
        }
    }
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
        }
        catch (error) {
            res.status(503).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message,
            });
        }
    });
    if (register && process.env.PROMETHEUS_ENABLED === 'true') {
        expressApp.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', register.contentType);
                res.end(await register.metrics());
            }
            catch (error) {
                res.status(500).json({ error: 'Metrics not available' });
            }
        });
        logger.log('Prometheus metrics available at /metrics');
    }
    const gracefulShutdown = (signal) => {
        logger.log(`Received ${signal}, starting graceful shutdown...`);
        setTimeout(() => {
            logger.error('Forceful shutdown due to timeout');
            process.exit(1);
        }, 30000);
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
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        if (Sentry && process.env.SENTRY_DSN) {
            Sentry.captureException(error);
        }
        gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        if (Sentry && process.env.SENTRY_DSN) {
            Sentry.captureException(new Error(`Unhandled Rejection: ${reason}`));
        }
    });
    if (Sentry && process.env.SENTRY_DSN) {
        app.use(Sentry.Handlers.errorHandler());
    }
    const port = configService.get('PORT', 3000);
    const host = configService.get('HOST', '0.0.0.0');
    await app.listen(port, host);
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
    const memoryUsage = process.memoryUsage();
    logger.log(`💾 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap used`);
    logger.log(`⏱️  Startup time: ${process.uptime().toFixed(2)}s`);
    logger.log('🔧 Feature flags:');
    logger.log(`  - Compression: ${process.env.COMPRESSION_ENABLED !== 'false' ? '✅' : '❌'}`);
    logger.log(`  - Rate limiting: ✅`);
    logger.log(`  - Monitoring: ${process.env.MONITORING_ENABLED === 'true' ? '✅' : '❌'}`);
    logger.log(`  - Sentry: ${process.env.SENTRY_DSN ? '✅' : '❌'}`);
    logger.log(`  - Prometheus: ${process.env.PROMETHEUS_ENABLED === 'true' ? '✅' : '❌'}`);
    logger.log(`  - New Relic: ${process.env.NEW_RELIC_ENABLED === 'true' ? '✅' : '❌'}`);
    if (process.env.NODE_ENV === 'production') {
        const requiredEnvVars = ['DATABASE_HOST', 'DATABASE_PASSWORD', 'JWT_SECRET', 'REDIS_HOST'];
        const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
        if (missingVars.length > 0) {
            logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
            logger.error('Application may not function properly in production');
        }
        else {
            logger.log('✅ All required environment variables are set');
        }
        logger.log('🔍 External services configured:');
        logger.log(`  - Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
        logger.log(`  - Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌'}`);
        logger.log(`  - Email: ${process.env.EMAIL_HOST ? '✅' : '❌'}`);
    }
    return app;
}
if (require.main === module) {
    bootstrap().catch((error) => {
        const logger = new common_1.Logger('Bootstrap');
        logger.error('Failed to start application:', error);
        if (Sentry && process.env.SENTRY_DSN) {
            Sentry.captureException(error);
        }
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map