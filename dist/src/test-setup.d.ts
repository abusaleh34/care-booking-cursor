import 'reflect-metadata';
import { TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
export declare function createMockRepository<T = any>(): MockRepository<T>;
export type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
export declare function createTestUser(overrides?: Partial<any>): {
    id: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createTestProvider(overrides?: Partial<any>): {
    id: string;
    userId: string;
    businessName: string;
    description: string;
    isVerified: boolean;
    rating: number;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createTestBooking(overrides?: Partial<any>): {
    id: string;
    customerId: string;
    providerId: string;
    serviceId: string;
    status: string;
    scheduledDate: Date;
    scheduledTime: string;
    duration: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createTestService(overrides?: Partial<any>): {
    id: string;
    providerId: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockConfigService: {
    get: jest.Mock<any, [key: string, defaultValue?: any], any>;
};
export declare const mockJwtService: {
    sign: jest.Mock<string, [payload: any], any>;
    verify: jest.Mock<{
        sub: string;
        email: string;
    }, [token: any], any>;
    decode: jest.Mock<{
        sub: string;
        email: string;
    }, [token: any], any>;
};
export declare const mockCacheManager: {
    get: jest.Mock<any, any, any>;
    set: jest.Mock<any, any, any>;
    del: jest.Mock<any, any, any>;
    reset: jest.Mock<any, any, any>;
};
export declare class TestModuleBuilder {
    private providers;
    private imports;
    addProvider(provider: any): this;
    addMockRepository(entity: any, mockRepo?: any): this;
    addMockService(serviceClass: any, mockImplementation: any): this;
    addImport(module: any): this;
    build(moduleClass: any): Promise<TestingModule>;
}
export declare function createTestDatabaseConnection(): Promise<void>;
export declare function createAuthenticatedRequest(app: any, token?: string): {
    get: (url: string) => any;
    post: (url: string) => any;
    put: (url: string) => any;
    patch: (url: string) => any;
    delete: (url: string) => any;
};
