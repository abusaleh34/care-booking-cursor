"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const admin_user_management_service_1 = require("./admin-user-management.service");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const user_role_entity_1 = require("../../database/entities/user-role.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const admin_user_entity_1 = require("../../database/entities/admin-user.entity");
const provider_verification_entity_1 = require("../../database/entities/provider-verification.entity");
const password_service_1 = require("../../auth/services/password.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
const email_service_1 = require("../../common/services/email.service");
const test_setup_1 = require("../../test-setup");
const admin_user_entity_2 = require("../../database/entities/admin-user.entity");
const provider_verification_entity_2 = require("../../database/entities/provider-verification.entity");
describe('AdminUserManagementService', () => {
    let service;
    let userRepository;
    let userRoleRepository;
    let serviceProviderRepository;
    let adminUserRepository;
    let providerVerificationRepository;
    let passwordService;
    let emailService;
    let realtimeGateway;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                admin_user_management_service_1.AdminUserManagementService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: (0, test_setup_1.createMockRepository)(),
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_role_entity_1.UserRole),
                    useValue: (0, test_setup_1.createMockRepository)(),
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(service_provider_entity_1.ServiceProvider),
                    useValue: (0, test_setup_1.createMockRepository)(),
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(admin_user_entity_1.AdminUser),
                    useValue: (0, test_setup_1.createMockRepository)(),
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(provider_verification_entity_1.ProviderVerification),
                    useValue: (0, test_setup_1.createMockRepository)(),
                },
                {
                    provide: password_service_1.PasswordService,
                    useValue: {
                        hashPassword: jest.fn(),
                        comparePassword: jest.fn(),
                    },
                },
                {
                    provide: email_service_1.EmailService,
                    useValue: {
                        sendAdminWelcomeEmail: jest.fn(),
                        sendPasswordResetEmail: jest.fn(),
                    },
                },
                {
                    provide: websocket_gateway_1.RealtimeGateway,
                    useValue: {
                        sendNotification: jest.fn(),
                        broadcastUpdate: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(admin_user_management_service_1.AdminUserManagementService);
        userRepository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
        userRoleRepository = module.get((0, typeorm_1.getRepositoryToken)(user_role_entity_1.UserRole));
        serviceProviderRepository = module.get((0, typeorm_1.getRepositoryToken)(service_provider_entity_1.ServiceProvider));
        adminUserRepository = module.get((0, typeorm_1.getRepositoryToken)(admin_user_entity_1.AdminUser));
        providerVerificationRepository = module.get((0, typeorm_1.getRepositoryToken)(provider_verification_entity_1.ProviderVerification));
        passwordService = module.get(password_service_1.PasswordService);
        emailService = module.get(email_service_1.EmailService);
        realtimeGateway = module.get(websocket_gateway_1.RealtimeGateway);
    });
    describe('createAdminUser', () => {
        const createAdminUserDto = {
            email: 'admin@example.com',
            fullName: 'Admin User',
            adminLevel: admin_user_entity_2.AdminLevel.MODERATOR,
            permissions: { users: ['read', 'write'] },
        };
        it('should create a new admin user successfully', async () => {
            const mockUser = (0, test_setup_1.createTestUser)({ id: 'user-123', email: createAdminUserDto.email });
            userRepository.findOne.mockResolvedValue(null);
            userRepository.create.mockReturnValue(mockUser);
            userRepository.save.mockResolvedValue(mockUser);
            userRoleRepository.create.mockReturnValue({ id: 'role-123' });
            userRoleRepository.save.mockResolvedValue({ id: 'role-123' });
            adminUserRepository.create.mockReturnValue({ id: 'admin-123' });
            adminUserRepository.save.mockResolvedValue({ id: 'admin-123' });
            passwordService.hashPassword.mockResolvedValue('hashed-password');
            emailService.sendAdminWelcomeEmail.mockResolvedValue(undefined);
            const result = await service.createAdminUser(createAdminUserDto);
            expect(result.user.email).toBe(createAdminUserDto.email);
            expect(result.message).toContain('Password setup instructions sent to email');
            expect(emailService.sendAdminWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({
                email: createAdminUserDto.email,
                fullName: createAdminUserDto.fullName,
                resetToken: expect.any(String),
                setupUrl: expect.stringContaining('/admin/setup-password'),
            }));
            expect(passwordService.hashPassword).toHaveBeenCalledTimes(2);
        });
        it('should throw ConflictException if user already exists', async () => {
            userRepository.findOne.mockResolvedValue((0, test_setup_1.createTestUser)());
            await expect(service.createAdminUser(createAdminUserDto)).rejects.toThrow(common_1.ConflictException);
            expect(emailService.sendAdminWelcomeEmail).not.toHaveBeenCalled();
        });
    });
    describe('updateAdminUser', () => {
        const adminId = 'admin-123';
        const updateDto = {
            adminLevel: admin_user_entity_2.AdminLevel.SUPER_ADMIN,
            permissions: { all: ['*'] },
            isActive: false,
        };
        it('should update admin user successfully', async () => {
            const mockAdminUser = {
                id: adminId,
                userId: 'user-123',
                adminLevel: 'moderator',
                permissions: {},
                user: (0, test_setup_1.createTestUser)({ id: 'user-123' }),
            };
            adminUserRepository.findOne.mockResolvedValue(mockAdminUser);
            adminUserRepository.save.mockResolvedValue({ ...mockAdminUser, ...updateDto });
            userRepository.save.mockResolvedValue(mockAdminUser.user);
            const result = await service.updateAdminUser(adminId, updateDto);
            expect(adminUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                adminLevel: updateDto.adminLevel,
                permissions: updateDto.permissions,
                isActive: updateDto.isActive,
            }));
            expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                isActive: updateDto.isActive,
            }));
        });
        it('should throw NotFoundException if admin user not found', async () => {
            adminUserRepository.findOne.mockResolvedValue(null);
            await expect(service.updateAdminUser(adminId, updateDto)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getUsers', () => {
        const filter = {
            search: 'test',
            userType: 'customer',
            status: 'active',
            page: 1,
            limit: 10,
        };
        it('should return paginated users with filters applied', async () => {
            const mockUsers = [(0, test_setup_1.createTestUser)(), (0, test_setup_1.createTestUser)()];
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
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining('LOWER(user.email) LIKE LOWER(:search)'), expect.objectContaining({ search: '%test%' }));
        });
    });
    describe('suspendUser', () => {
        const userId = 'user-123';
        const reason = 'Violation of terms';
        const adminId = 'admin-123';
        it('should suspend user successfully', async () => {
            const mockUser = (0, test_setup_1.createTestUser)({ id: userId, isActive: true });
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.save.mockResolvedValue({ ...mockUser, isActive: false });
            const result = await service.suspendUser(userId, reason, adminId);
            expect(result.message).toBe('User suspended successfully');
            expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
        });
        it('should throw NotFoundException if user not found', async () => {
            userRepository.findOne.mockResolvedValue(null);
            await expect(service.suspendUser(userId, reason, adminId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('performBulkAction', () => {
        const bulkAction = {
            userIds: ['user-1', 'user-2'],
            action: 'suspend',
            reason: 'Bulk suspension',
        };
        const adminId = 'admin-123';
        it('should perform bulk action on all users', async () => {
            const mockUsers = [(0, test_setup_1.createTestUser)({ id: 'user-1' }), (0, test_setup_1.createTestUser)({ id: 'user-2' })];
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
            const mockUsers = [(0, test_setup_1.createTestUser)({ id: 'user-1' }), (0, test_setup_1.createTestUser)({ id: 'user-2' })];
            userRepository.findBy.mockResolvedValue(mockUsers);
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
            expect(result.results).toContainEqual(expect.objectContaining({
                userId: 'user-2',
                status: 'error',
            }));
        });
        it('should throw NotFoundException if some users not found', async () => {
            const partialBulkAction = {
                userIds: ['user-1', 'user-2', 'user-3'],
                action: 'suspend',
                reason: 'Bulk suspension',
            };
            userRepository.findBy.mockResolvedValue([(0, test_setup_1.createTestUser)({ id: 'user-1' })]);
            await expect(service.performBulkAction(partialBulkAction, adminId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('reviewProviderVerification', () => {
        const verificationId = 'verification-123';
        const reviewDto = {
            status: provider_verification_entity_2.VerificationStatus.APPROVED,
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
            providerVerificationRepository.findOne.mockResolvedValue(mockVerification);
            providerVerificationRepository.save.mockResolvedValue({
                ...mockVerification,
                status: 'approved',
                adminId,
                reviewedAt: new Date(),
                notes: reviewDto.notes,
            });
            serviceProviderRepository.save.mockResolvedValue({
                ...mockVerification.provider,
                isVerified: true,
            });
            const result = await service.reviewProviderVerification(verificationId, reviewDto, adminId);
            expect(result.status).toBe('approved');
            expect(providerVerificationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                status: 'approved',
                notes: reviewDto.notes,
                adminId,
            }));
            expect(serviceProviderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                isVerified: true,
            }));
        });
        it('should throw NotFoundException if verification not found', async () => {
            providerVerificationRepository.findOne.mockResolvedValue(null);
            await expect(service.reviewProviderVerification(verificationId, reviewDto, adminId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
//# sourceMappingURL=admin-user-management.service.spec.js.map