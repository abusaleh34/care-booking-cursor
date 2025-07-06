import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Booking } from '../../database/entities/booking.entity';
import { Dispute } from '../../database/entities/dispute.entity';
import { Review } from '../../database/entities/review.entity';
import { AdminDashboardFilterDto } from '../dto/admin.dto';
import { BookingStatus } from '../../database/entities/booking.entity';
import { DisputeStatus } from '../../database/entities/dispute.entity';
export declare class AdminDashboardService {
    private userRepository;
    private providerRepository;
    private bookingRepository;
    private disputeRepository;
    private reviewRepository;
    constructor(userRepository: Repository<User>, providerRepository: Repository<ServiceProvider>, bookingRepository: Repository<Booking>, disputeRepository: Repository<Dispute>, reviewRepository: Repository<Review>);
    getDashboardOverview(filter: AdminDashboardFilterDto): Promise<{
        platformMetrics: {
            totalUsers: number;
            totalProviders: number;
            totalBookings: number;
            activeUsers: number;
            completedBookings: number;
            providerToUserRatio: number;
            completionRate: number;
        };
        userMetrics: {
            newUsers: number;
            newProviders: number;
            verifiedProviders: number;
            suspendedUsers: number;
            verificationRate: number;
        };
        bookingMetrics: {
            total: number;
            completed: number;
            cancelled: number;
            pending: number;
            averageValue: number;
            completionRate: number;
            cancellationRate: number;
        };
        financialMetrics: {
            totalRevenue: number;
            totalCommission: number;
            totalPayouts: number;
            refundCount: number;
            refundAmount: number;
            netRevenue: number;
        };
        recentActivity: ({
            type: string;
            id: string;
            description: string;
            user: string;
            timestamp: Date;
            status: BookingStatus;
        } | {
            type: string;
            id: string;
            description: string;
            user: string;
            timestamp: Date;
            status: DisputeStatus;
        })[];
        generatedAt: Date;
    }>;
    getGrowthAnalytics(filter: AdminDashboardFilterDto): Promise<{
        userGrowth: any[];
        providerGrowth: any[];
        bookingGrowth: any[];
        revenueGrowth: any[];
        timeframe: "daily" | "weekly" | "monthly" | "yearly";
        period: {
            startDate: string;
            endDate: string;
        };
    }>;
    getSystemHealth(): Promise<{
        status: string;
        pendingDisputes: number;
        pendingVerifications: number;
        systemAlerts: any[];
        lastChecked: Date;
    }>;
    getFinancialOverview(filter: AdminDashboardFilterDto): Promise<{
        revenue: {
            total: number;
        };
        commissions: {
            total: number;
        };
        payouts: {
            total: number;
        };
        refunds: {
            total: number;
        };
        netRevenue: number;
        platformCommission: number;
        topProviders: any[];
        topCategories: any[];
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    private getPlatformMetrics;
    private getUserMetrics;
    private getBookingMetrics;
    private getFinancialMetrics;
    private getRecentActivity;
    private getDateRange;
    private getUserGrowthData;
    private getProviderGrowthData;
    private getBookingGrowthData;
    private getRevenueGrowthData;
    private getPendingDisputes;
    private getPendingVerifications;
    private getSystemAlerts;
    private calculateHealthStatus;
    private getRevenueData;
    private getCommissionData;
    private getPayoutData;
    private getRefundData;
    private getTopProviders;
    private getTopCategories;
}
