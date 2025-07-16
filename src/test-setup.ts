import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { vi, beforeEach, afterEach } from 'vitest';

// Global test configuration
global.console = {
  ...console,
  // Silence logs in tests unless specifically needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock common external services
vi.mock('stripe', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

vi.mock('nodemailer', () => ({
  createTransporter: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

vi.mock('twilio', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'test-message-sid' }),
    },
  })),
}));

// Global beforeEach for all tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after tests
afterEach(() => {
  vi.resetAllMocks();
});

// Mock repository factory
export function createMockRepository<T = any>(): MockRepository<T> {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    findBy: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orWhere: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn(),
      getOne: vi.fn(),
      getCount: vi.fn(),
      getRawMany: vi.fn(),
      getRawOne: vi.fn(),
    })),
    count: vi.fn(),
    findAndCount: vi.fn(),
    increment: vi.fn(),
    decrement: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
  };
}

export type MockRepository<T = any> = Partial<Record<keyof Repository<T>, any>>;

// Test data factories
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    passwordHash: 'hashed_password',
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestProvider(overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    userId: uuidv4(),
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

export function createTestBooking(overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    customerId: uuidv4(),
    providerId: uuidv4(),
    serviceId: uuidv4(),
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

export function createTestService(overrides: Partial<any> = {}) {
  return {
    id: uuidv4(),
    providerId: uuidv4(),
    categoryId: uuidv4(),
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

// Mock services
export const mockConfigService = {
  get: vi.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
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

export const mockJwtService = {
  sign: vi.fn((payload) => 'mock-jwt-token'),
  verify: vi.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
  decode: vi.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
};

export const mockCacheManager = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  reset: vi.fn(),
};

// Test module builder
export class TestModuleBuilder {
  private providers: any[] = [];
  private imports: any[] = [];

  addProvider(provider: any): this {
    this.providers.push(provider);
    return this;
  }

  addMockRepository(entity: any, mockRepo?: any): this {
    this.providers.push({
      provide: getRepositoryToken(entity),
      useValue: mockRepo || createMockRepository(),
    });
    return this;
  }

  addMockService(serviceClass: any, mockImplementation: any): this {
    this.providers.push({
      provide: serviceClass,
      useValue: mockImplementation,
    });
    return this;
  }

  addImport(module: any): this {
    this.imports.push(module);
    return this;
  }

  async build(moduleClass: any): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: this.imports,
      providers: [...this.providers],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();
  }
}

// Database connection helper for integration tests
export async function createTestDatabaseConnection() {
  // This would be used for integration tests with a real test database
  // For now, we'll use mocks in unit tests
}

// Request helper for E2E tests
export function createAuthenticatedRequest(app: any, token?: string) {
  const authToken = token || 'Bearer mock-jwt-token';
  return {
    get: (url: string) => app.get(url).set('Authorization', authToken),
    post: (url: string) => app.post(url).set('Authorization', authToken),
    put: (url: string) => app.put(url).set('Authorization', authToken),
    patch: (url: string) => app.patch(url).set('Authorization', authToken),
    delete: (url: string) => app.delete(url).set('Authorization', authToken),
  };
}

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

// Suppress console logs during tests
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
}
