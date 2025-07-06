import { Repository } from 'typeorm';
import { ServiceCategory } from '../database/entities/service-category.entity';
import { ServiceProvider } from '../database/entities/service-provider.entity';
import { Service } from '../database/entities/service.entity';
import { User } from '../database/entities/user.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class AdminService {
    private categoryRepository;
    private providerRepository;
    private serviceRepository;
    private userRepository;
    constructor(categoryRepository: Repository<ServiceCategory>, providerRepository: Repository<ServiceProvider>, serviceRepository: Repository<Service>, userRepository: Repository<User>);
    createCategory(createCategoryDto: CreateCategoryDto, adminUserId: string): Promise<ServiceCategory>;
    updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<ServiceCategory>;
    deleteCategory(id: string): Promise<void>;
    getAllCategories(): Promise<ServiceCategory[]>;
    getAllProviders(page?: number, limit?: number): Promise<{
        data: ServiceProvider[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    verifyProvider(providerId: string): Promise<ServiceProvider>;
    deactivateProvider(providerId: string): Promise<ServiceProvider>;
    activateProvider(providerId: string): Promise<ServiceProvider>;
    getAllUsers(page?: number, limit?: number): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    deactivateUser(userId: string): Promise<User>;
    activateUser(userId: string): Promise<User>;
    verifyUser(userId: string): Promise<User>;
    getPlatformStats(): Promise<{
        totalUsers: number;
        totalProviders: number;
        totalServices: number;
        totalCategories: number;
        verifiedProviders: number;
        activeServices: number;
        verificationRate: string | number;
    }>;
}
