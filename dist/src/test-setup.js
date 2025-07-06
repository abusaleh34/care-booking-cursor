"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestModuleBuilder = exports.mockCacheManager = exports.mockJwtService = exports.mockConfigService = void 0;
exports.createMockRepository = createMockRepository;
exports.createTestUser = createTestUser;
exports.createTestProvider = createTestProvider;
exports.createTestBooking = createTestBooking;
exports.createTestService = createTestService;
exports.createTestDatabaseConnection = createTestDatabaseConnection;
exports.createAuthenticatedRequest = createAuthenticatedRequest;
require("reflect-metadata");
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1';
jest.setTimeout(30000);
jest.mock('stripe', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        paymentIntents: {
            create: jest.fn(),
            confirm: jest.fn(),
            cancel: jest.fn(),
        },
        refunds: {
            create: jest.fn(),
        },
        webhooks: {
            constructEvent: jest.fn(),
        },
    })),
}));
jest.mock('nodemailer', () => ({
    createTransporter: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    })),
}));
jest.mock('twilio', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        messages: {
            create: jest.fn().mockResolvedValue({ sid: 'test-message-sid' }),
        },
    })),
}));
beforeEach(() => {
    jest.clearAllMocks();
});
afterEach(() => {
    jest.resetAllMocks();
});
function createMockRepository() {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        findBy: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orWhere: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            innerJoinAndSelect: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getOne: jest.fn(),
            getCount: jest.fn(),
            getRawMany: jest.fn(),
            getRawOne: jest.fn(),
        })),
        count: jest.fn(),
        findAndCount: jest.fn(),
        increment: jest.fn(),
        decrement: jest.fn(),
        softDelete: jest.fn(),
        restore: jest.fn(),
    };
}
function createTestUser(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function createTestProvider(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        userId: (0, uuid_1.v4)(),
        businessName: 'Test Business',
        description: 'Test description',
        isVerified: false,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function createTestBooking(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        customerId: (0, uuid_1.v4)(),
        providerId: (0, uuid_1.v4)(),
        serviceId: (0, uuid_1.v4)(),
        status: 'pending',
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        duration: 60,
        totalPrice: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
function createTestService(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        providerId: (0, uuid_1.v4)(),
        categoryId: (0, uuid_1.v4)(),
        name: 'Test Service',
        description: 'Test service description',
        price: 50,
        duration: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
exports.mockConfigService = {
    get: jest.fn((key, defaultValue) => {
        const config = {
            JWT_SECRET: 'test-secret',
            JWT_EXPIRES_IN: '1h',
            DATABASE_HOST: 'localhost',
            DATABASE_PORT: 5432,
            REDIS_HOST: 'localhost',
            REDIS_PORT: 6379,
        };
        return config[key] || defaultValue;
    }),
};
exports.mockJwtService = {
    sign: jest.fn((payload) => 'mock-jwt-token'),
    verify: jest.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
    decode: jest.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
};
exports.mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
};
class TestModuleBuilder {
    constructor() {
        this.providers = [];
        this.imports = [];
    }
    addProvider(provider) {
        this.providers.push(provider);
        return this;
    }
    addMockRepository(entity, mockRepo) {
        this.providers.push({
            provide: (0, typeorm_1.getRepositoryToken)(entity),
            useValue: mockRepo || createMockRepository(),
        });
        return this;
    }
    addMockService(serviceClass, mockImplementation) {
        this.providers.push({
            provide: serviceClass,
            useValue: mockImplementation,
        });
        return this;
    }
    addImport(module) {
        this.imports.push(module);
        return this;
    }
    async build(moduleClass) {
        return testing_1.Test.createTestingModule({
            imports: this.imports,
            providers: [...this.providers],
        })
            .overrideProvider(config_1.ConfigService)
            .useValue(exports.mockConfigService)
            .overrideProvider(jwt_1.JwtService)
            .useValue(exports.mockJwtService)
            .compile();
    }
}
exports.TestModuleBuilder = TestModuleBuilder;
async function createTestDatabaseConnection() {
}
function createAuthenticatedRequest(app, token) {
    const authToken = token || 'Bearer mock-jwt-token';
    return {
        get: (url) => app.get(url).set('Authorization', authToken),
        post: (url) => app.post(url).set('Authorization', authToken),
        put: (url) => app.put(url).set('Authorization', authToken),
        patch: (url) => app.patch(url).set('Authorization', authToken),
        delete: (url) => app.delete(url).set('Authorization', authToken),
    };
}
beforeEach(() => {
    jest.clearAllMocks();
});
if (process.env.NODE_ENV === 'test') {
    global.console = {
        ...console,
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };
}
//# sourceMappingURL=test-setup.js.map