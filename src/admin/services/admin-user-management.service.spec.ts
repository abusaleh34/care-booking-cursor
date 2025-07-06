import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminUserManagementService } from './admin-user-management.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { PasswordService } from '../../auth/services/password.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { EmailService } from '../../common/services/email.service';
import { createMockRepository, createTestUser, MockRepository } from '../../test-setup';
import { RoleType } from '../../database/entities/user-role.entity';
import { AdminLevel } from '../../database/entities/admin-user.entity';
import { VerificationStatus } from '../../database/entities/provider-verification.entity';

describe('AdminUserManagementService', () => {
  let service: AdminUserManagementService;
  let userRepository: MockRepository<User>;
  let userRoleRepository: MockRepository<UserRole>;
  let serviceProviderRepository: MockRepository<ServiceProvider>;
  let adminUserRepository: MockRepository<AdminUser>;
  let providerVerificationRepository: MockRepository<ProviderVerification>;
  let passwordService: jest.Mocked<PasswordService>;
  let emailService: jest.Mocked<EmailService>;
  let realtimeGateway: jest.Mocked<RealtimeGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserManagementService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AdminUser),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(ProviderVerification),
          useValue: createMockRepository(),
        },
        {
          provide: PasswordService,
          useValue: {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendAdminWelcomeEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: RealtimeGateway,
          useValue: {
            sendNotification: jest.fn(),
            broadcastUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminUserManagementService>(AdminUserManagementService);
    userRepository = module.get(getRepositoryToken(User));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
    serviceProviderRepository = module.get(getRepositoryToken(ServiceProvider));
    adminUserRepository = module.get(getRepositoryToken(AdminUser));
    providerVerificationRepository = module.get(getRepositoryToken(ProviderVerification));
    passwordService = module.get(PasswordService);
    emailService = module.get(EmailService);
    realtimeGateway = module.get(RealtimeGateway);
  });

  describe('createAdminUser', () => {
    const createAdminUserDto = {
      email: 'admin@example.com',
      fullName: 'Admin User',
      adminLevel: AdminLevel.MODERATOR,
      permissions: { users: ['read', 'write'] },
    };

    it('should create a new admin user successfully', async () => {
      const mockUser = createTestUser({ id: 'user-123', email: createAdminUserDto.email });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      userRoleRepository.create.mockReturnValue({ id: 'role-123' } as any);
      userRoleRepository.save.mockResolvedValue({ id: 'role-123' } as any);
      adminUserRepository.create.mockReturnValue({ id: 'admin-123' } as any);
      adminUserRepository.save.mockResolvedValue({ id: 'admin-123' } as any);
      passwordService.hashPassword.mockResolvedValue('hashed-password');
      emailService.sendAdminWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.createAdminUser(createAdminUserDto);

      expect(result.user.email).toBe(createAdminUserDto.email);
      expect(result.message).toContain('Password setup instructions sent to email');
      expect(emailService.sendAdminWelcomeEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createAdminUserDto.email,
          fullName: createAdminUserDto.fullName,
          resetToken: expect.any(String),
          setupUrl: expect.stringContaining('/admin/setup-password'),
        }),
      );
      expect(passwordService.hashPassword).toHaveBeenCalledTimes(2); // Password and reset token
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue(createTestUser());

      await expect(service.createAdminUser(createAdminUserDto)).rejects.toThrow(ConflictException);
      expect(emailService.sendAdminWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('updateAdminUser', () => {
    const adminId = 'admin-123';
    const updateDto = {
      adminLevel: AdminLevel.SUPER_ADMIN,
      permissions: { all: ['*'] },
      isActive: false,
    };

    it('should update admin user successfully', async () => {
      const mockAdminUser = {
        id: adminId,
        userId: 'user-123',
        adminLevel: 'moderator',
        permissions: {},
        user: createTestUser({ id: 'user-123' }),
      };

      adminUserRepository.findOne.mockResolvedValue(mockAdminUser as any);
      adminUserRepository.save.mockResolvedValue({ ...mockAdminUser, ...updateDto } as any);
      userRepository.save.mockResolvedValue(mockAdminUser.user);

      const result = await service.updateAdminUser(adminId, updateDto);

      expect(adminUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          adminLevel: updateDto.adminLevel,
          permissions: updateDto.permissions,
          isActive: updateDto.isActive,
        }),
      );
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: updateDto.isActive,
        }),
      );
    });

    it('should throw NotFoundException if admin user not found', async () => {
      adminUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateAdminUser(adminId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsers', () => {
    const filter = {
      search: 'test',
      userType: 'customer' as const,
      status: 'active' as const,
      page: 1,
      limit: 10,
    };

    it('should return paginated users with filters applied', async () => {
      const mockUsers = [createTestUser(), createTestUser()];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
        getOne: jest.fn(),
        getCount: jest.fn().mockResolvedValue(2),
        getRawMany: jest.fn(),
        getRawOne: jest.fn(),
      };
      
      userRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUsers(filter);

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(user.email) LIKE LOWER(:search)'),
        expect.objectContaining({ search: '%test%' }),
      );
    });
  });

  describe('suspendUser', () => {
    const userId = 'user-123';
    const reason = 'Violation of terms';
    const adminId = 'admin-123';

    it('should suspend user successfully', async () => {
      const mockUser = createTestUser({ id: userId, isActive: true });

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.suspendUser(userId, reason, adminId);

      expect(result.message).toBe('User suspended successfully');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.suspendUser(userId, reason, adminId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('performBulkAction', () => {
    const bulkAction = {
      userIds: ['user-1', 'user-2'],
      action: 'suspend' as const,
      reason: 'Bulk suspension',
    };
    const adminId = 'admin-123';

    it('should perform bulk action on all users', async () => {
      const mockUsers = [createTestUser({ id: 'user-1' }), createTestUser({ id: 'user-2' })];

      userRepository.findBy.mockResolvedValue(mockUsers);
      userRepository.findOne.mockImplementation((options) => {
        if (options && options.where && options.where.id) {
          return Promise.resolve(mockUsers.find((u) => u.id === options.where.id));
        }
        return Promise.resolve(null);
      });
      userRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.performBulkAction(bulkAction, adminId);

      expect(result.totalProcessed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(userRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk actions', async () => {
      const mockUsers = [createTestUser({ id: 'user-1' }), createTestUser({ id: 'user-2' })];

      userRepository.findBy.mockResolvedValue(mockUsers);
      // Mock implementation that returns user for first call, null for second
      let callCount = 0;
      userRepository.findOne.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(mockUsers[0]);
        }
        return Promise.resolve(null);
      });
      userRepository.save.mockResolvedValue(mockUsers[0]);

      const result = await service.performBulkAction(bulkAction, adminId);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toContainEqual(
        expect.objectContaining({
          userId: 'user-2',
          status: 'error',
        }),
      );
    });
    
    it('should throw NotFoundException if some users not found', async () => {
      const partialBulkAction = {
        userIds: ['user-1', 'user-2', 'user-3'],
        action: 'suspend' as const,
        reason: 'Bulk suspension',
      };
      
      userRepository.findBy.mockResolvedValue([createTestUser({ id: 'user-1' })]); // Only one user found
      
      await expect(service.performBulkAction(partialBulkAction, adminId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reviewProviderVerification', () => {
    const verificationId = 'verification-123';
    const reviewDto = {
      status: VerificationStatus.APPROVED,
      notes: 'All documents verified',
    };
    const adminId = 'admin-123';

    it('should approve provider verification', async () => {
      const mockVerification = {
        id: verificationId,
        status: 'pending',
        provider: {
          id: 'provider-123',
          userId: 'user-123',
          isVerified: false,
        },
      };

      providerVerificationRepository.findOne.mockResolvedValue(mockVerification as any);
      providerVerificationRepository.save.mockResolvedValue({
        ...mockVerification,
        status: 'approved',
        adminId,
        reviewedAt: new Date(),
        notes: reviewDto.notes,
      } as any);
      serviceProviderRepository.save.mockResolvedValue({
        ...mockVerification.provider,
        isVerified: true,
      } as any);

      const result = await service.reviewProviderVerification(verificationId, reviewDto, adminId);

      expect(result.status).toBe('approved');
      expect(providerVerificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          notes: reviewDto.notes,
          adminId,
        }),
      );
      expect(serviceProviderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: true,
        }),
      );
    });

    it('should throw NotFoundException if verification not found', async () => {
      providerVerificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.reviewProviderVerification(verificationId, reviewDto, adminId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
