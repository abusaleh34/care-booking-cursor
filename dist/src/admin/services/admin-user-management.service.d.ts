import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { BulkUserActionDto, CreateAdminUserDto, UpdateAdminUserDto, UserManagementFilterDto, VerificationReviewDto } from '../dto/admin.dto';
import { PasswordService } from '../../auth/services/password.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { EmailService } from '../../common/services/email.service';
export declare class AdminUserManagementService {
    private userRepository;
    private userRoleRepository;
    private serviceProviderRepository;
    private adminUserRepository;
    private providerVerificationRepository;
    private passwordService;
    private realtimeGateway;
    private emailService;
    constructor(userRepository: Repository<User>, userRoleRepository: Repository<UserRole>, serviceProviderRepository: Repository<ServiceProvider>, adminUserRepository: Repository<AdminUser>, providerVerificationRepository: Repository<ProviderVerification>, passwordService: PasswordService, realtimeGateway: RealtimeGateway, emailService: EmailService);
    createAdminUser(createAdminUserDto: CreateAdminUserDto): Promise<any>;
    updateAdminUser(adminId: string, updateDto: UpdateAdminUserDto): Promise<AdminUser>;
    getAdminUsers(filter: UserManagementFilterDto): Promise<{
        data: AdminUser[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUsers(filter: UserManagementFilterDto): Promise<{
        data: User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUserById(userId: string): Promise<User>;
    suspendUser(userId: string, reason: string, adminId: string): Promise<{
        message: string;
    }>;
    activateUser(userId: string, adminId: string): Promise<{
        message: string;
    }>;
    deleteUser(userId: string, adminId: string): Promise<{
        message: string;
    }>;
    performBulkAction(bulkAction: BulkUserActionDto, adminId: string): Promise<{
        message: string;
        results: any[];
        totalProcessed: number;
        successful: number;
        failed: number;
    }>;
    getProviderVerifications(filter: any): Promise<{
        data: ProviderVerification[];
        pagination: {
            page: any;
            limit: any;
            total: number;
            totalPages: number;
        };
    }>;
    reviewProviderVerification(verificationId: string, reviewDto: VerificationReviewDto, adminId: string): Promise<ProviderVerification>;
    private logAdminAction;
}
