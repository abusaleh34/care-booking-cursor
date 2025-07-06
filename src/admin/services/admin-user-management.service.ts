import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { RoleType } from '../../database/entities/user-role.entity';
import {
  BulkUserActionDto,
  CreateAdminUserDto,
  ProviderVerificationDto,
  UpdateAdminUserDto,
  UserManagementFilterDto,
  VerificationReviewDto,
} from '../dto/admin.dto';
import { PasswordService } from '../../auth/services/password.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { EmailService } from '../../common/services/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminUserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(ServiceProvider)
    private serviceProviderRepository: Repository<ServiceProvider>,
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(ProviderVerification)
    private providerVerificationRepository: Repository<ProviderVerification>,
    private passwordService: PasswordService,
    private realtimeGateway: RealtimeGateway,
    private emailService: EmailService,
  ) {}

  // Admin User Management
  async createAdminUser(createAdminUserDto: CreateAdminUserDto): Promise<any> {
    const { email, fullName, adminLevel, permissions } = createAdminUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate secure password reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 24); // 24 hour expiry

    // Create user with random password (user must reset)
    const temporaryPassword = randomBytes(32).toString('hex');
    const hashedPassword = await this.passwordService.hashPassword(temporaryPassword);

    // Create user entity properly
    const userData = {
      email,
      passwordHash: hashedPassword,
      isVerified: false, // Require email verification
      isActive: true,
      passwordResetToken: await this.passwordService.hashPassword(resetToken),
      passwordResetExpiry: resetTokenExpiry,
    };

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Create admin role
    const roleData = {
      userId: savedUser.id,
      roleType: RoleType.ADMIN,
      isActive: true,
    };

    // Create admin user record
    const adminUserData = {
      userId: savedUser.id,
      adminLevel,
      permissions: permissions || {},
    };

    await Promise.all([
      this.userRoleRepository.save(this.userRoleRepository.create(roleData)),
      this.adminUserRepository.save(this.adminUserRepository.create(adminUserData)),
    ]);

    // Send secure password setup email
    await this.emailService.sendAdminWelcomeEmail({
      email: savedUser.email,
      fullName,
      resetToken,
      setupUrl: `${process.env.FRONTEND_URL}/admin/setup-password?token=${resetToken}&email=${email}`,
    });

    // Log admin creation (without sensitive data)
    console.log(`Admin user created: ${savedUser.email} - Password setup email sent`);

    // Return user data without sensitive information
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

  async updateAdminUser(adminId: string, updateDto: UpdateAdminUserDto) {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminId },
      relations: ['user'],
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    // Update admin user properties
    if (updateDto.adminLevel !== undefined) {
      adminUser.adminLevel = updateDto.adminLevel;
    }

    if (updateDto.permissions !== undefined) {
      adminUser.permissions = updateDto.permissions;
    }

    if (updateDto.isActive !== undefined) {
      adminUser.isActive = updateDto.isActive;
      // Also update the base user account
      adminUser.user.isActive = updateDto.isActive;
      await this.userRepository.save(adminUser.user);
    }

    const updatedAdmin = await this.adminUserRepository.save(adminUser);

    // Simplified notification
    console.log(`Admin user updated: ${adminUser.userId}`);

    return updatedAdmin;
  }

  async getAdminUsers(filter: UserManagementFilterDto) {
    const queryBuilder = this.adminUserRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile');

    if (filter.search) {
      queryBuilder.andWhere(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.full_name) LIKE LOWER(:search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.status === 'active') {
      queryBuilder.andWhere('admin.isActive = :isActive', { isActive: true });
    } else if (filter.status === 'suspended') {
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

  // User Management
  async getUsers(filter: UserManagementFilterDto) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.roles', 'roles');

    if (filter.search) {
      queryBuilder.andWhere(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER(profile.full_name) LIKE LOWER(:search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.userType) {
      if (filter.userType === 'provider') {
        queryBuilder.andWhere('roles.roleType = :roleType', {
          roleType: RoleType.SERVICE_PROVIDER,
        });
      } else if (filter.userType === 'customer') {
        queryBuilder.andWhere('roles.roleType = :roleType', { roleType: RoleType.CUSTOMER });
      } else if (filter.userType === 'admin') {
        queryBuilder.andWhere('roles.roleType = :roleType', { roleType: RoleType.ADMIN });
      }
    }

    if (filter.status === 'active') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    } else if (filter.status === 'suspended') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
    } else if (filter.status === 'pending') {
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

  async getUserById(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'roles', 'serviceProvider'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async suspendUser(userId: string, reason: string, adminId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    // Log the action
    await this.logAdminAction(
      adminId,
      'suspend_user',
      'User',
      userId,
      { isActive: true },
      { isActive: false, reason },
    );

    // Simplified notification
    console.log(`User suspended: ${userId} - ${reason}`);

    return { message: 'User suspended successfully' };
  }

  async activateUser(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    await this.userRepository.save(user);

    // Log the action
    await this.logAdminAction(
      adminId,
      'activate_user',
      'User',
      userId,
      { isActive: false },
      { isActive: true },
    );

    // Simplified notification
    console.log(`User activated: ${userId}`);

    return { message: 'User activated successfully' };
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete - mark as deleted instead of removing from database
    user.isActive = false;
    user.email = `deleted_${user.id}@deleted.com`;
    await this.userRepository.save(user);

    // Log the action
    await this.logAdminAction(
      adminId,
      'delete_user',
      'User',
      userId,
      { isActive: true },
      { isActive: false, deleted: true },
    );

    return { message: 'User deleted successfully' };
  }

  async performBulkAction(bulkAction: BulkUserActionDto, adminId: string) {
    const users = await this.userRepository.findBy({
      id: In(bulkAction.userIds),
    });

    if (users.length !== bulkAction.userIds.length) {
      throw new NotFoundException('Some users not found');
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
      } catch (error) {
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

  // Provider Verification Management
  async getProviderVerifications(filter: any) {
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

  async reviewProviderVerification(
    verificationId: string,
    reviewDto: VerificationReviewDto,
    adminId: string,
  ) {
    const verification = await this.providerVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['provider'],
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    verification.status = reviewDto.status;
    verification.notes = reviewDto.notes;
    verification.adminId = adminId;
    verification.reviewedAt = new Date();

    await this.providerVerificationRepository.save(verification);

    // Update provider verification status if approved
    if (reviewDto.status === 'approved') {
      verification.provider.isVerified = true;
      await this.serviceProviderRepository.save(verification.provider);
    }

    // Simplified notification
    console.log(
      `Provider verification updated: ${verification.provider.userId} - ${verification.status}`,
    );

    return verification;
  }

  // Helper Methods
  private async logAdminAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues: any,
    newValues: any,
  ) {
    // Implementation for audit logging
    // This would typically use an audit log service
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
}
