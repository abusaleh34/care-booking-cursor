import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PasswordService } from '../../../src/auth/services/password.service';
import { ConfigService } from '@nestjs/config';

// Mock bcrypt before importing
vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('mocked-hash'),
  compare: vi.fn().mockResolvedValue(true),
}));

import * as bcrypt from 'bcrypt';

describe('PasswordService (Simple)', () => {
  let service: PasswordService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up bcrypt mocks
    (bcrypt.hash as any).mockResolvedValue('mocked-hash');
    (bcrypt.compare as any).mockResolvedValue(true);
    
    // Create a mock ConfigService with proper typing
    mockConfigService = {
      get: vi.fn((key: string) => {
        const config = {
          'BCRYPT_ROUNDS': '12',
        };
        return config[key] || '12';
      }),
    } as any;

    // Manually instantiate the service with the mock
    service = new PasswordService(mockConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password correctly', async () => {
    const password = 'testPassword123!';
    const result = await service.hashPassword(password);
    
    expect(result).toBe('mocked-hash');
  });

  it('should compare passwords correctly', async () => {
    const password = 'testPassword123!';
    const hash = 'stored-hash';
    const result = await service.comparePassword(password, hash);
    
    expect(result).toBe(true);
  });

  it('should generate temporary password', () => {
    const tempPassword = service.generateTemporaryPassword();
    
    expect(tempPassword).toHaveLength(12);
    expect(typeof tempPassword).toBe('string');
  });

  it('should validate password strength', () => {
    const strongPassword = 'StrongPass123!';
    const weakPassword = 'weak';
    
    const strongResult = service.validatePasswordStrength(strongPassword);
    const weakResult = service.validatePasswordStrength(weakPassword);
    
    expect(strongResult.isValid).toBe(true);
    expect(weakResult.isValid).toBe(false);
    expect(weakResult.errors.length).toBeGreaterThan(0);
  });
}); 