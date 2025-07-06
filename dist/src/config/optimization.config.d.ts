declare const _default: (() => {
    performance: {
        compression: {
            enabled: boolean;
            level: number;
            threshold: number;
        };
        rateLimit: {
            windowMs: number;
            max: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        slowDown: {
            windowMs: number;
            delayAfter: number;
            delayMs: number;
        };
        pagination: {
            defaultLimit: number;
            maxLimit: number;
        };
    };
    cache: {
        redis: {
            host: string;
            port: number;
            password: string;
            db: number;
            keyPrefix: string;
            maxRetriesPerRequest: number;
            retryDelayOnFailover: number;
            enableReadyCheck: boolean;
            maxMemoryPolicy: string;
        };
        ttl: {
            searchResults: number;
            providerProfiles: number;
            serviceCategories: number;
            userSessions: number;
            availabilityData: number;
            dashboardMetrics: number;
            staticContent: number;
        };
        prefixes: {
            search: string;
            provider: string;
            category: string;
            session: string;
            availability: string;
            dashboard: string;
            static: string;
        };
    };
    database: {
        connectionPool: {
            min: number;
            max: number;
            acquireTimeout: number;
            timeout: number;
        };
        queryTimeout: number;
        logging: boolean;
        synchronize: boolean;
        migrationsRun: boolean;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    queue: {
        redis: {
            host: string;
            port: number;
            password: string;
            db: number;
        };
        defaultJobOptions: {
            removeOnComplete: number;
            removeOnFail: number;
            attempts: number;
            backoff: {
                type: string;
                delay: number;
            };
        };
        concurrency: {
            email: number;
            sms: number;
            analytics: number;
            reports: number;
            cleanup: number;
        };
    };
    monitoring: {
        enabled: boolean;
        sentry: {
            dsn: string;
            environment: string;
            tracesSampleRate: number;
            debug: boolean;
        };
        newrelic: {
            enabled: boolean;
            appName: string;
            licenseKey: string;
        };
        prometheus: {
            enabled: boolean;
            port: number;
            endpoint: string;
        };
        healthCheck: {
            interval: number;
            timeout: number;
            retries: number;
        };
    };
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: string[];
                    styleSrc: string[];
                    scriptSrc: string[];
                    imgSrc: string[];
                    connectSrc: string[];
                    fontSrc: string[];
                    objectSrc: string[];
                    mediaSrc: string[];
                    frameSrc: string[];
                };
            };
            crossOriginEmbedderPolicy: boolean;
        };
        cors: {
            origin: string[];
            methods: string[];
            allowedHeaders: string[];
            credentials: boolean;
            maxAge: number;
        };
        brute: {
            freeRetries: number;
            minWait: number;
            maxWait: number;
            lifetime: number;
        };
    };
    storage: {
        provider: string;
        local: {
            uploadPath: string;
            maxFileSize: number;
        };
        aws: {
            accessKeyId: string;
            secretAccessKey: string;
            region: string;
            bucket: string;
        };
        gcp: {
            projectId: string;
            keyFilename: string;
            bucket: string;
        };
        cdn: {
            enabled: boolean;
            baseUrl: string;
        };
        imageOptimization: {
            enabled: boolean;
            quality: number;
            formats: string[];
            sizes: {
                thumbnail: {
                    width: number;
                    height: number;
                };
                small: {
                    width: number;
                    height: number;
                };
                medium: {
                    width: number;
                    height: number;
                };
                large: {
                    width: number;
                    height: number;
                };
            };
        };
    };
    integrations: {
        google: {
            analytics: {
                enabled: boolean;
                measurementId: string;
                apiSecret: string;
            };
            oauth: {
                clientId: string;
                clientSecret: string;
            };
            maps: {
                apiKey: string;
                enabled: boolean;
            };
        };
        facebook: {
            oauth: {
                appId: string;
                appSecret: string;
            };
        };
        mixpanel: {
            enabled: boolean;
            token: string;
        };
        datadog: {
            enabled: boolean;
            apiKey: string;
            appKey: string;
        };
    };
    thresholds: {
        apiResponseTime: {
            p50: number;
            p95: number;
            p99: number;
        };
        databaseQuery: {
            slow: number;
            critical: number;
        };
        cacheHitRate: {
            warning: number;
            critical: number;
        };
        errorRate: {
            warning: number;
            critical: number;
        };
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    performance: {
        compression: {
            enabled: boolean;
            level: number;
            threshold: number;
        };
        rateLimit: {
            windowMs: number;
            max: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        slowDown: {
            windowMs: number;
            delayAfter: number;
            delayMs: number;
        };
        pagination: {
            defaultLimit: number;
            maxLimit: number;
        };
    };
    cache: {
        redis: {
            host: string;
            port: number;
            password: string;
            db: number;
            keyPrefix: string;
            maxRetriesPerRequest: number;
            retryDelayOnFailover: number;
            enableReadyCheck: boolean;
            maxMemoryPolicy: string;
        };
        ttl: {
            searchResults: number;
            providerProfiles: number;
            serviceCategories: number;
            userSessions: number;
            availabilityData: number;
            dashboardMetrics: number;
            staticContent: number;
        };
        prefixes: {
            search: string;
            provider: string;
            category: string;
            session: string;
            availability: string;
            dashboard: string;
            static: string;
        };
    };
    database: {
        connectionPool: {
            min: number;
            max: number;
            acquireTimeout: number;
            timeout: number;
        };
        queryTimeout: number;
        logging: boolean;
        synchronize: boolean;
        migrationsRun: boolean;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    queue: {
        redis: {
            host: string;
            port: number;
            password: string;
            db: number;
        };
        defaultJobOptions: {
            removeOnComplete: number;
            removeOnFail: number;
            attempts: number;
            backoff: {
                type: string;
                delay: number;
            };
        };
        concurrency: {
            email: number;
            sms: number;
            analytics: number;
            reports: number;
            cleanup: number;
        };
    };
    monitoring: {
        enabled: boolean;
        sentry: {
            dsn: string;
            environment: string;
            tracesSampleRate: number;
            debug: boolean;
        };
        newrelic: {
            enabled: boolean;
            appName: string;
            licenseKey: string;
        };
        prometheus: {
            enabled: boolean;
            port: number;
            endpoint: string;
        };
        healthCheck: {
            interval: number;
            timeout: number;
            retries: number;
        };
    };
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: string[];
                    styleSrc: string[];
                    scriptSrc: string[];
                    imgSrc: string[];
                    connectSrc: string[];
                    fontSrc: string[];
                    objectSrc: string[];
                    mediaSrc: string[];
                    frameSrc: string[];
                };
            };
            crossOriginEmbedderPolicy: boolean;
        };
        cors: {
            origin: string[];
            methods: string[];
            allowedHeaders: string[];
            credentials: boolean;
            maxAge: number;
        };
        brute: {
            freeRetries: number;
            minWait: number;
            maxWait: number;
            lifetime: number;
        };
    };
    storage: {
        provider: string;
        local: {
            uploadPath: string;
            maxFileSize: number;
        };
        aws: {
            accessKeyId: string;
            secretAccessKey: string;
            region: string;
            bucket: string;
        };
        gcp: {
            projectId: string;
            keyFilename: string;
            bucket: string;
        };
        cdn: {
            enabled: boolean;
            baseUrl: string;
        };
        imageOptimization: {
            enabled: boolean;
            quality: number;
            formats: string[];
            sizes: {
                thumbnail: {
                    width: number;
                    height: number;
                };
                small: {
                    width: number;
                    height: number;
                };
                medium: {
                    width: number;
                    height: number;
                };
                large: {
                    width: number;
                    height: number;
                };
            };
        };
    };
    integrations: {
        google: {
            analytics: {
                enabled: boolean;
                measurementId: string;
                apiSecret: string;
            };
            oauth: {
                clientId: string;
                clientSecret: string;
            };
            maps: {
                apiKey: string;
                enabled: boolean;
            };
        };
        facebook: {
            oauth: {
                appId: string;
                appSecret: string;
            };
        };
        mixpanel: {
            enabled: boolean;
            token: string;
        };
        datadog: {
            enabled: boolean;
            apiKey: string;
            appKey: string;
        };
    };
    thresholds: {
        apiResponseTime: {
            p50: number;
            p95: number;
            p99: number;
        };
        databaseQuery: {
            slow: number;
            critical: number;
        };
        cacheHitRate: {
            warning: number;
            critical: number;
        };
        errorRate: {
            warning: number;
            critical: number;
        };
    };
}>;
export default _default;
