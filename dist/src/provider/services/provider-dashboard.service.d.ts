import { Repository } from 'typeorm';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Booking } from '../../database/entities/booking.entity';
import { CacheService } from '../../cache/cache.service';
import { AnalyticsFilterDto, EarningsFilterDto } from '../dto/provider.dto';
export interface DashboardOverview {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalEarnings: number;
    monthlyEarnings: number;
    averageRating: number;
    totalReviews: number;
    activeServices: number;
    unreadMessages: number;
    recentBookings: any[];
    earningsChart: any[];
    ratingTrend: any[];
}
export interface EarningsData {
    totalEarnings: number;
    periodEarnings: number;
    earningsBreakdown: any[];
    payoutsPending: number;
    payoutsCompleted: number;
    commissionRate: number;
    grossEarnings: number;
    netEarnings: number;
}
export interface AnalyticsData {
    bookingTrends: any[];
    revenueTrends: any[];
    ratingTrends: any[];
    customerInsights: any;
    servicePerformance: any[];
    peakHours: any[];
    cancellationRate: number;
    repeatCustomers: number;
}
export declare class ProviderDashboardService {
    private readonly providerRepository;
    private readonly bookingRepository;
    private readonly cacheService;
    constructor(providerRepository: Repository<ServiceProvider>, bookingRepository: Repository<Booking>, cacheService: CacheService);
    getDashboardOverview(providerId: string): Promise<DashboardOverview>;
    getEarningsData(providerId: string, filter: EarningsFilterDto): Promise<EarningsData>;
    getAnalyticsData(providerId: string, filter: AnalyticsFilterDto): Promise<AnalyticsData>;
    private generateEarningsChart;
    private generateRatingTrend;
    private generateEarningsBreakdown;
    private generateBookingTrends;
    private generateRevenueTrends;
    private generateRatingTrends;
    private generateCustomerInsights;
    private generateServicePerformance;
    private generatePeakHours;
    private getWeekNumber;
}
