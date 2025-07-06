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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_category_entity_1 = require("../database/entities/service-category.entity");
const service_provider_entity_1 = require("../database/entities/service-provider.entity");
const service_entity_1 = require("../database/entities/service.entity");
const user_entity_1 = require("../database/entities/user.entity");
let AdminService = class AdminService {
    constructor(categoryRepository, providerRepository, serviceRepository, userRepository) {
        this.categoryRepository = categoryRepository;
        this.providerRepository = providerRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
    }
    async createCategory(createCategoryDto, adminUserId) {
        const existingCategory = await this.categoryRepository.findOne({
            where: { name: createCategoryDto.name },
        });
        if (existingCategory) {
            throw new common_1.ConflictException('Category with this name already exists');
        }
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
    async updateCategory(id, updateCategoryDto) {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
            const existingCategory = await this.categoryRepository.findOne({
                where: { name: updateCategoryDto.name },
            });
            if (existingCategory) {
                throw new common_1.ConflictException('Category with this name already exists');
            }
        }
        Object.assign(category, updateCategoryDto);
        return await this.categoryRepository.save(category);
    }
    async deleteCategory(id) {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const servicesCount = await this.serviceRepository.count({
            where: { categoryId: id },
        });
        if (servicesCount > 0) {
            throw new common_1.ConflictException('Cannot delete category that has services. Please reassign or delete services first.');
        }
        await this.categoryRepository.remove(category);
    }
    async getAllCategories() {
        return await this.categoryRepository.find({
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }
    async getAllProviders(page = 1, limit = 20) {
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
    async verifyProvider(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        provider.isVerified = true;
        return await this.providerRepository.save(provider);
    }
    async deactivateProvider(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        provider.isActive = false;
        return await this.providerRepository.save(provider);
    }
    async activateProvider(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        provider.isActive = true;
        return await this.providerRepository.save(provider);
    }
    async getAllUsers(page = 1, limit = 20) {
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
    async deactivateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isAdmin = user.roles.some((role) => role.roleType === 'admin' && role.isActive);
        if (isAdmin) {
            throw new common_1.ConflictException('Cannot deactivate admin accounts for security reasons');
        }
        user.isActive = false;
        return await this.userRepository.save(user);
    }
    async activateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isActive = true;
        return await this.userRepository.save(user);
    }
    async verifyUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.isVerified = true;
        return await this.userRepository.save(user);
    }
    async getPlatformStats() {
        const [totalUsers, totalProviders, totalServices, totalCategories, verifiedProviders, activeServices,] = await Promise.all([
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
            verificationRate: totalProviders > 0 ? ((verifiedProviders / totalProviders) * 100).toFixed(1) : 0,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_category_entity_1.ServiceCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(2, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map