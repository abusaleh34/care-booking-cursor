"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const user_role_entity_1 = require("../../database/entities/user-role.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const admin_user_entity_1 = require("../../database/entities/admin-user.entity");
const provider_verification_entity_1 = require("../../database/entities/provider-verification.entity");
const user_role_entity_2 = require("../../database/entities/user-role.entity");
const password_service_1 = require("../../auth/services/password.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
const email_service_1 = require("../../common/services/email.service");
const crypto_1 = require("crypto");
let AdminUserManagementService = class AdminUserManagementService {
    constructor(userRepository, userRoleRepository, serviceProviderRepository, adminUserRepository, providerVerificationRepository, passwordService, realtimeGateway, emailService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.serviceProviderRepository = serviceProviderRepository;
        this.adminUserRepository = adminUserRepository;
        this.providerVerificationRepository = providerVerificationRepository;
        this.passwordService = passwordService;
        this.realtimeGateway = realtimeGateway;
        this.emailService = emailService;
    }
    async createAdminUser(createAdminUserDto) {
        const { email, fullName, adminLevel, permissions } = createAdminUserDto;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24);
        const temporaryPassword = (0, crypto_1.randomBytes)(32).toString('hex');
        const hashedPassword = await this.passwordService.hashPassword(temporaryPassword);
        const userData = {
            email,
            passwordHash: hashedPassword,
            isVerified: false,
            isActive: true,
            passwordResetToken: await this.passwordService.hashPassword(resetToken),
            passwordResetExpiry: resetTokenExpiry,
        };
        const user = this.userRepository.create(userData);
        const savedUser = await this.userRepository.save(user);
        const roleData = {
            userId: savedUser.id,
            roleType: user_role_entity_2.RoleType.ADMIN,
            isActive: true,
        };
        const adminUserData = {
            userId: savedUser.id,
            adminLevel,
            permissions: permissions || {},
        };
        await Promise.all([
            this.userRoleRepository.save(this.userRoleRepository.create(roleData)),
            this.adminUserRepository.save(this.adminUserRepository.create(adminUserData)),
        ]);
        await this.emailService.sendAdminWelcomeEmail({
            email: savedUser.email,
            fullName,
            resetToken,
            setupUrl: `${process.env.FRONTEND_URL}/admin/setup-password?token=${resetToken}&email=${email}`,
        });
        console.log(`Admin user created: ${savedUser.email} - Password setup email sent`);
        return {
            user: {
                id: savedUser.id,
                email: savedUser.email,
                fullName,
                adminLevel,
                isActive: savedUser.isActive,
                isVerified: savedUser.isVerified,
                createdAt: savedUser.createdAt,
            },
            message: 'Admin user created successfully. Password setup instructions sent to email.',
        };
    }
    async updateAdminUser(adminId, updateDto) {
        const adminUser = await this.adminUserRepository.findOne({
            where: { id: adminId },
            relations: ['user'],
        });
        if (!adminUser) {
            throw new common_1.NotFoundException('Admin user not found');
        }
        if (updateDto.adminLevel !== undefined) {
            adminUser.adminLevel = updateDto.adminLevel;
        }
        if (updateDto.permissions !== undefined) {
            adminUser.permissions = updateDto.permissions;
        }
        if (updateDto.isActive !== undefined) {
            adminUser.isActive = updateDto.isActive;
            adminUser.user.isActive = updateDto.isActive;
            await this.userRepository.save(adminUser.user);
        }
        const updatedAdmin = await this.adminUserRepository.save(adminUser);
        console.log(`Admin user updated: ${adminUser.userId}`);
        return updatedAdmin;
    }
    async getAdminUsers(filter) {
        const queryBuilder = this.adminUserRepository
            .createQueryBuilder('admin')
            .leftJoinAndSelect('admin.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile');
        if (filter.search) {
            queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.full_name) LIKE LOWER(:search)', { search: `%${filter.search}%` });
        }
        if (filter.status === 'active') {
            queryBuilder.andWhere('admin.isActive = :isActive', { isActive: true });
        }
        else if (filter.status === 'suspended') {
            queryBuilder.andWhere('admin.isActive = :isActive', { isActive: false });
        }
        if (filter.registeredAfter) {
            queryBuilder.andWhere('admin.createdAt >= :registeredAfter', {
                registeredAfter: new Date(filter.registeredAfter),
            });
        }
        if (filter.registeredBefore) {
            queryBuilder.andWhere('admin.createdAt <= :registeredBefore', {
                registeredBefore: new Date(filter.registeredBefore),
            });
        }
        const total = await queryBuilder.getCount();
        const admins = await queryBuilder
            .skip((filter.page - 1) * filter.limit)
            .take(filter.limit)
            .orderBy('admin.createdAt', 'DESC')
            .getMany();
        return {
            data: admins,
            pagination: {
                page: filter.page,
                limit: filter.limit,
                total,
                totalPages: Math.ceil(total / filter.limit),
            },
        };
    }
    async getUsers(filter) {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('user.roles', 'roles');
        if (filter.search) {
            queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.full_name) LIKE LOWER(:search)', { search: `%${filter.search}%` });
        }
        if (filter.userType) {
            if (filter.userType === 'provider') {
                queryBuilder.andWhere('roles.roleType = :roleType', {
                    roleType: user_role_entity_2.RoleType.SERVICE_PROVIDER,
                });
            }
            else if (filter.userType === 'customer') {
                queryBuilder.andWhere('roles.roleType = :roleType', { roleType: user_role_entity_2.RoleType.CUSTOMER });
            }
            else if (filter.userType === 'admin') {
                queryBuilder.andWhere('roles.roleType = :roleType', { roleType: user_role_entity_2.RoleType.ADMIN });
            }
        }
        if (filter.status === 'active') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
        }
        else if (filter.status === 'suspended') {
            queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
        }
        else if (filter.status === 'pending') {
            queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified: false });
        }
        if (filter.registeredAfter) {
            queryBuilder.andWhere('user.createdAt >= :registeredAfter', {
                registeredAfter: new Date(filter.registeredAfter),
            });
        }
        if (filter.registeredBefore) {
            queryBuilder.andWhere('user.createdAt <= :registeredBefore', {
                registeredBefore: new Date(filter.registeredBefore),
            });
        }
        const total = await queryBuilder.getCount();
        const users = await queryBuilder
            .skip((filter.page - 1) * filter.limit)
            .take(filter.limit)
            .orderBy('user.createdAt', 'DESC')
            .getMany();
        return {
            data: users,
            pagination: {
                page: filter.page,
                limit: filter.limit,
                total,
                totalPages: Math.ceil(total / filter.limit),
            },
        };
    }
    async getUserById(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['profile', 'roles', 'serviceProvider'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async suspendUser(userId, reason, adminId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = false;
        await this.userRepository.save(user);
        await this.logAdminAction(adminId, 'suspend_user', 'User', userId, { isActive: true }, { isActive: false, reason });
        console.log(`User suspended: ${userId} - ${reason}`);
        return { message: 'User suspended successfully' };
    }
    async activateUser(userId, adminId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = true;
        await this.userRepository.save(user);
        await this.logAdminAction(adminId, 'activate_user', 'User', userId, { isActive: false }, { isActive: true });
        console.log(`User activated: ${userId}`);
        return { message: 'User activated successfully' };
    }
    async deleteUser(userId, adminId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = false;
        user.email = `deleted_${user.id}@deleted.com`;
        await this.userRepository.save(user);
        await this.logAdminAction(adminId, 'delete_user', 'User', userId, { isActive: true }, { isActive: false, deleted: true });
        return { message: 'User deleted successfully' };
    }
    async performBulkAction(bulkAction, adminId) {
        const users = await this.userRepository.findBy({
            id: (0, typeorm_2.In)(bulkAction.userIds),
        });
        if (users.length !== bulkAction.userIds.length) {
            throw new common_1.NotFoundException('Some users not found');
        }
        const results = [];
        for (const user of users) {
            try {
                switch (bulkAction.action) {
                    case 'activate':
                        await this.activateUser(user.id, adminId);
                        results.push({ userId: user.id, status: 'success', action: 'activated' });
                        break;
                    case 'suspend':
                        await this.suspendUser(user.id, bulkAction.reason || 'Bulk action', adminId);
                        results.push({ userId: user.id, status: 'success', action: 'suspended' });
                        break;
                    case 'delete':
                        await this.deleteUser(user.id, adminId);
                        results.push({ userId: user.id, status: 'success', action: 'deleted' });
                        break;
                    case 'verify':
                        user.isVerified = true;
                        await this.userRepository.save(user);
                        results.push({ userId: user.id, status: 'success', action: 'verified' });
                        break;
                }
            }
            catch (error) {
                results.push({
                    userId: user.id,
                    status: 'error',
                    message: error.message,
                });
            }
        }
        return {
            message: 'Bulk action completed',
            results,
            totalProcessed: results.length,
            successful: results.filter((r) => r.status === 'success').length,
            failed: results.filter((r) => r.status === 'error').length,
        };
    }
    async getProviderVerifications(filter) {
        const queryBuilder = this.providerVerificationRepository
            .createQueryBuilder('verification')
            .leftJoinAndSelect('verification.provider', 'provider')
            .leftJoinAndSelect('provider.user', 'user')
            .leftJoinAndSelect('verification.admin', 'admin')
            .leftJoinAndSelect('admin.user', 'adminUser');
        if (filter.status) {
            queryBuilder.andWhere('verification.status = :status', { status: filter.status });
        }
        if (filter.verificationType) {
            queryBuilder.andWhere('verification.verificationType = :type', {
                type: filter.verificationType,
            });
        }
        const total = await queryBuilder.getCount();
        const verifications = await queryBuilder
            .skip((filter.page - 1) * filter.limit)
            .take(filter.limit)
            .orderBy('verification.createdAt', 'DESC')
            .getMany();
        return {
            data: verifications,
            pagination: {
                page: filter.page,
                limit: filter.limit,
                total,
                totalPages: Math.ceil(total / filter.limit),
            },
        };
    }
    async reviewProviderVerification(verificationId, reviewDto, adminId) {
        const verification = await this.providerVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['provider'],
        });
        if (!verification) {
            throw new common_1.NotFoundException('Verification not found');
        }
        verification.status = reviewDto.status;
        verification.notes = reviewDto.notes;
        verification.adminId = adminId;
        verification.reviewedAt = new Date();
        await this.providerVerificationRepository.save(verification);
        if (reviewDto.status === 'approved') {
            verification.provider.isVerified = true;
            await this.serviceProviderRepository.save(verification.provider);
        }
        console.log(`Provider verification updated: ${verification.provider.userId} - ${verification.status}`);
        return verification;
    }
    async logAdminAction(adminId, action, resourceType, resourceId, oldValues, newValues) {
        console.log('Admin action logged:', {
            adminId,
            action,
            resourceType,
            resourceId,
            oldValues,
            newValues,
            timestamp: new Date(),
        });
    }
};
exports.AdminUserManagementService = AdminUserManagementService;
exports.AdminUserManagementService = AdminUserManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(2, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(3, (0, typeorm_1.InjectRepository)(admin_user_entity_1.AdminUser)),
    __param(4, (0, typeorm_1.InjectRepository)(provider_verification_entity_1.ProviderVerification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        password_service_1.PasswordService,
        websocket_gateway_1.RealtimeGateway,
        email_service_1.EmailService])
], AdminUserManagementService);
//# sourceMappingURL=admin-user-management.service.js.map