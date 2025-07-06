"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const password_service_1 = require("./password.service");
const config_1 = require("@nestjs/config");
jest.mock('bcrypt');
const bcrypt = require("bcrypt");
describe('PasswordService', () => {
    let service;
    const mockConfigService = {
        get: jest.fn().mockReturnValue('12'),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        bcrypt.hash.mockResolvedValue('mocked-hash');
        bcrypt.compare.mockResolvedValue(true);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                password_service_1.PasswordService,
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
        service = module.get(password_service_1.PasswordService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('hashPassword', () => {
        it('should hash password correctly', async () => {
            const password = 'testPassword123!';
            const result = await service.hashPassword(password);
            expect(result).toBe('mocked-hash');
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        });
        it('should use correct salt rounds from config', async () => {
            const password = 'testPassword123!';
            await service.hashPassword(password);
            expect(mockConfigService.get).toHaveBeenCalledWith('BCRYPT_ROUNDS');
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        });
        it('should use default salt rounds when config is not available', async () => {
            mockConfigService.get.mockReturnValueOnce(undefined);
            const password = 'testPassword123!';
            await service.hashPassword(password);
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        });
    });
    describe('comparePassword', () => {
        it('should verify password correctly', async () => {
            const password = 'testPassword123!';
            const hash = 'valid-hash';
            const result = await service.comparePassword(password, hash);
            expect(result).toBe(true);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
        });
        it('should reject invalid password', async () => {
            bcrypt.compare.mockResolvedValueOnce(false);
            const password = 'wrongPassword456!';
            const hash = 'valid-hash';
            const result = await service.comparePassword(password, hash);
            expect(result).toBe(false);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
        });
    });
    describe('generateTemporaryPassword', () => {
        it('should generate a valid temporary password', () => {
            const tempPassword = service.generateTemporaryPassword();
            expect(tempPassword).toBeDefined();
            expect(typeof tempPassword).toBe('string');
            expect(tempPassword.length).toBe(12);
        });
        it('should generate different passwords on multiple calls', () => {
            const password1 = service.generateTemporaryPassword();
            const password2 = service.generateTemporaryPassword();
            expect(password1).not.toBe(password2);
        });
        it('should only contain allowed characters', () => {
            const tempPassword = service.generateTemporaryPassword();
            const allowedChars = /^[ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*]+$/;
            expect(allowedChars.test(tempPassword)).toBe(true);
        });
    });
    describe('validatePasswordStrength', () => {
        it('should validate strong passwords', () => {
            const strongPasswords = [
                'StrongPass123!',
                'MySecure2Password#',
                'Complex1Password$',
                'ValidPassword9@',
            ];
            strongPasswords.forEach((password) => {
                const result = service.validatePasswordStrength(password);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });
        it('should reject passwords that are too short', () => {
            const shortPassword = 'Short1!';
            const result = service.validatePasswordStrength(shortPassword);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });
        it('should reject passwords without uppercase letters', () => {
            const password = 'lowercase123!';
            const result = service.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });
        it('should reject passwords without lowercase letters', () => {
            const password = 'UPPERCASE123!';
            const result = service.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });
        it('should reject passwords without numbers', () => {
            const password = 'NoNumbers!';
            const result = service.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });
        it('should reject passwords without special characters', () => {
            const password = 'NoSpecialChars123';
            const result = service.validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });
        it('should return multiple errors for weak passwords', () => {
            const weakPassword = 'weak';
            const result = service.validatePasswordStrength(weakPassword);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
    describe('createSecureHash', () => {
        it('should create a secure hash', async () => {
            const data = 'sensitive-data';
            const result = await service.createSecureHash(data);
            expect(result).toBe('mocked-hash');
            expect(bcrypt.hash).toHaveBeenCalledWith(data, 12);
        });
    });
    describe('verifySecureHash', () => {
        it('should verify secure hash correctly', async () => {
            const data = 'test-data';
            const hash = 'valid-hash';
            const result = await service.verifySecureHash(data, hash);
            expect(result).toBe(true);
            expect(bcrypt.compare).toHaveBeenCalledWith(data, hash);
        });
        it('should reject invalid data against hash', async () => {
            bcrypt.compare.mockResolvedValueOnce(false);
            const data = 'wrong-data';
            const hash = 'valid-hash';
            const result = await service.verifySecureHash(data, hash);
            expect(result).toBe(false);
            expect(bcrypt.compare).toHaveBeenCalledWith(data, hash);
        });
    });
});
//# sourceMappingURL=password.service.spec.js.map