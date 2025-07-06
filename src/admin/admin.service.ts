import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../database/entities/service-category.entity';
import { ServiceProvider } from '../database/entities/service-provider.entity';
import { Service } from '../database/entities/service.entity';
import { User } from '../database/entities/user.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ServiceCategory)
    private categoryRepository: Repository<ServiceCategory>,
    @InjectRepository(ServiceProvider)
    private providerRepository: Repository<ServiceProvider>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Category Management
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    adminUserId: string,
  ): Promise<ServiceCategory> {
    // Check if category name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Get the highest sort order and increment
    const maxSortOrder = await this.categoryRepository
      .createQueryBuilder('category')
      .select('MAX(category.sortOrder)', 'maxSort')
      .getRawOne();

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      sortOrder: (maxSortOrder?.maxSort || 0) + 1,
    });

    return await this.categoryRepository.save(category);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if name is being changed and if it conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has services
    const servicesCount = await this.serviceRepository.count({
      where: { categoryId: id },
    });

    if (servicesCount > 0) {
      throw new ConflictException(
        'Cannot delete category that has services. Please reassign or delete services first.',
      );
    }

    await this.categoryRepository.remove(category);
  }

  async getAllCategories() {
    return await this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // Provider Management
  async getAllProviders(page: number = 1, limit: number = 20) {
    const [providers, total] = await this.providerRepository.findAndCount({
      relations: ['user', 'user.profile', 'services'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: providers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyProvider(providerId: string): Promise<ServiceProvider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.isVerified = true;
    return await this.providerRepository.save(provider);
  }

  async deactivateProvider(providerId: string): Promise<ServiceProvider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.isActive = false;
    return await this.providerRepository.save(provider);
  }

  async activateProvider(providerId: string): Promise<ServiceProvider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.isActive = true;
    return await this.providerRepository.save(provider);
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['profile', 'roles'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating admin accounts
    const isAdmin = user.roles.some((role) => role.roleType === 'admin' && role.isActive);
    if (isAdmin) {
      throw new ConflictException('Cannot deactivate admin accounts for security reasons');
    }

    user.isActive = false;
    return await this.userRepository.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    return await this.userRepository.save(user);
  }

  async verifyUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isVerified = true;
    return await this.userRepository.save(user);
  }

  // Platform Statistics
  async getPlatformStats() {
    const [
      totalUsers,
      totalProviders,
      totalServices,
      totalCategories,
      verifiedProviders,
      activeServices,
    ] = await Promise.all([
      this.userRepository.count(),
      this.providerRepository.count(),
      this.serviceRepository.count(),
      this.categoryRepository.count(),
      this.providerRepository.count({ where: { isVerified: true } }),
      this.serviceRepository.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      totalProviders,
      totalServices,
      totalCategories,
      verifiedProviders,
      activeServices,
      verificationRate:
        totalProviders > 0 ? ((verifiedProviders / totalProviders) * 100).toFixed(1) : 0,
    };
  }
}
