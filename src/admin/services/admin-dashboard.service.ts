import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Booking } from '../../database/entities/booking.entity';
import { Dispute } from '../../database/entities/dispute.entity';
import { Review } from '../../database/entities/review.entity';
import { AdminDashboardFilterDto } from '../dto/admin.dto';
import { BookingStatus } from '../../database/entities/booking.entity';
import { DisputeStatus } from '../../database/entities/dispute.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ServiceProvider)
    private providerRepository: Repository<ServiceProvider>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getDashboardOverview(filter: AdminDashboardFilterDto) {
    // Simplified without cache for now
    const { startDate, endDate } = this.getDateRange(filter);

    const [platformMetrics, userMetrics, bookingMetrics, financialMetrics, recentActivity] =
      await Promise.all([
        this.getPlatformMetrics(startDate, endDate),
        this.getUserMetrics(startDate, endDate),
        this.getBookingMetrics(startDate, endDate),
        this.getFinancialMetrics(startDate, endDate),
        this.getRecentActivity(10),
      ]);

    const dashboard = {
      platformMetrics,
      userMetrics,
      bookingMetrics,
      financialMetrics,
      recentActivity,
      generatedAt: new Date(),
    };

    return dashboard;
  }

  async getGrowthAnalytics(filter: AdminDashboardFilterDto) {
    const { startDate, endDate, timeframe } = filter;

    const [userGrowth, providerGrowth, bookingGrowth, revenueGrowth] = await Promise.all([
      this.getUserGrowthData(startDate, endDate, timeframe),
      this.getProviderGrowthData(startDate, endDate, timeframe),
      this.getBookingGrowthData(startDate, endDate, timeframe),
      this.getRevenueGrowthData(startDate, endDate, timeframe),
    ]);

    return {
      userGrowth,
      providerGrowth,
      bookingGrowth,
      revenueGrowth,
      timeframe,
      period: { startDate, endDate },
    };
  }

  async getSystemHealth() {
    const [pendingDisputes, pendingVerifications, systemAlerts] = await Promise.all([
      this.getPendingDisputes(),
      this.getPendingVerifications(),
      this.getSystemAlerts(),
    ]);

    const health = {
      status: this.calculateHealthStatus(pendingDisputes, pendingVerifications, 0),
      pendingDisputes,
      pendingVerifications,
      systemAlerts,
      lastChecked: new Date(),
    };

    return health;
  }

  async getFinancialOverview(filter: AdminDashboardFilterDto) {
    const { startDate, endDate } = this.getDateRange(filter);

    const [revenue, commissions, payouts, refunds, topProviders, topCategories] = await Promise.all(
      [
        this.getRevenueData(startDate, endDate),
        this.getCommissionData(startDate, endDate),
        this.getPayoutData(startDate, endDate),
        this.getRefundData(startDate, endDate),
        this.getTopProviders(startDate, endDate),
        this.getTopCategories(startDate, endDate),
      ],
    );

    return {
      revenue,
      commissions,
      payouts,
      refunds,
      netRevenue: revenue.total - refunds.total,
      platformCommission: commissions.total,
      topProviders,
      topCategories,
      period: { startDate, endDate },
    };
  }

  private async getPlatformMetrics(startDate: Date, endDate: Date) {
    const [totalUsers, totalProviders, totalBookings, activeUsers, completedBookings] =
      await Promise.all([
        this.userRepository.count(),
        this.providerRepository.count(),
        this.bookingRepository.count(),
        this.userRepository.count({
          where: {
            lastLoginAt: Between(startDate, endDate),
          },
        }),
        this.bookingRepository.count({
          where: {
            status: BookingStatus.COMPLETED,
            updatedAt: Between(startDate, endDate),
          },
        }),
      ]);

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      activeUsers,
      completedBookings,
      providerToUserRatio: totalUsers > 0 ? (totalProviders / totalUsers) * 100 : 0,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    };
  }

  private async getUserMetrics(startDate: Date, endDate: Date) {
    const [newUsers, newProviders, verifiedProviders, suspendedUsers] = await Promise.all([
      this.userRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
      this.providerRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
      this.providerRepository.count({
        where: {
          isVerified: true,
          createdAt: Between(startDate, endDate),
        },
      }),
      this.userRepository.count({
        where: {
          isActive: false,
        },
      }),
    ]);

    return {
      newUsers,
      newProviders,
      verifiedProviders,
      suspendedUsers,
      verificationRate: newProviders > 0 ? (verifiedProviders / newProviders) * 100 : 0,
    };
  }

  private async getBookingMetrics(startDate: Date, endDate: Date) {
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .select([
        'COUNT(*) as total',
        "COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed",
        "COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled",
        "COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending",
        'AVG(total_amount) as averageValue',
      ])
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return {
      total: parseInt(bookings.total) || 0,
      completed: parseInt(bookings.completed) || 0,
      cancelled: parseInt(bookings.cancelled) || 0,
      pending: parseInt(bookings.pending) || 0,
      averageValue: parseFloat(bookings.averageValue) || 0,
      completionRate: bookings.total > 0 ? (bookings.completed / bookings.total) * 100 : 0,
      cancellationRate: bookings.total > 0 ? (bookings.cancelled / bookings.total) * 100 : 0,
    };
  }

  private async getFinancialMetrics(startDate: Date, endDate: Date) {
    const financial = await this.bookingRepository
      .createQueryBuilder('booking')
      .select([
        'SUM(total_amount) as totalRevenue',
        'SUM(platform_fee) as totalCommission',
        'SUM(provider_earnings) as totalPayouts',
        "COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refundCount",
        "SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END) as refundAmount",
      ])
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return {
      totalRevenue: parseFloat(financial.totalRevenue) || 0,
      totalCommission: parseFloat(financial.totalCommission) || 0,
      totalPayouts: parseFloat(financial.totalPayouts) || 0,
      refundCount: parseInt(financial.refundCount) || 0,
      refundAmount: parseFloat(financial.refundAmount) || 0,
      netRevenue:
        (parseFloat(financial.totalRevenue) || 0) - (parseFloat(financial.refundAmount) || 0),
    };
  }

  private async getRecentActivity(limit: number) {
    // This would combine recent activities from various tables
    // For brevity, returning recent bookings and disputes
    const [recentBookings, recentDisputes] = await Promise.all([
      this.bookingRepository.find({
        take: Math.floor(limit / 2),
        order: { createdAt: 'DESC' },
        relations: ['customer', 'provider', 'service'],
      }),
      this.disputeRepository.find({
        take: Math.floor(limit / 2),
        order: { createdAt: 'DESC' },
        relations: ['reporter', 'reported', 'booking'],
      }),
    ]);

    const activities = [
      ...recentBookings.map((booking) => ({
        type: 'booking',
        id: booking.id,
        description: `New booking: ${booking.service?.name || 'Unknown service'}`,
        user: booking.customer?.email || 'Unknown user',
        timestamp: booking.createdAt,
        status: booking.status,
      })),
      ...recentDisputes.map((dispute) => ({
        type: 'dispute',
        id: dispute.id,
        description: `New dispute: ${dispute.disputeType}`,
        user: dispute.reporter?.email || 'Unknown user',
        timestamp: dispute.createdAt,
        status: dispute.status,
      })),
    ];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  private getDateRange(filter: AdminDashboardFilterDto) {
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
    let startDate: Date;

    if (filter.startDate) {
      startDate = new Date(filter.startDate);
    } else {
      // Default to last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private async getUserGrowthData(startDate: string, endDate: string, timeframe: string) {
    // Implementation for user growth analytics
    // This would return time-series data for charts
    return [];
  }

  private async getProviderGrowthData(startDate: string, endDate: string, timeframe: string) {
    // Implementation for provider growth analytics
    return [];
  }

  private async getBookingGrowthData(startDate: string, endDate: string, timeframe: string) {
    // Implementation for booking growth analytics
    return [];
  }

  private async getRevenueGrowthData(startDate: string, endDate: string, timeframe: string) {
    // Implementation for revenue growth analytics
    return [];
  }

  private async getPendingDisputes() {
    return await this.disputeRepository.count({
      where: { status: DisputeStatus.OPEN },
    });
  }

  private async getPendingVerifications() {
    // This would require the ProviderVerification repository
    return 0; // Placeholder
  }

  private async getSystemAlerts() {
    // Implementation for system alerts
    return [];
  }

  private calculateHealthStatus(disputes: number, verifications: number, flagged: number) {
    const totalIssues = disputes + verifications + flagged;
    if (totalIssues === 0) return 'excellent';
    if (totalIssues < 10) return 'good';
    if (totalIssues < 50) return 'warning';
    return 'critical';
  }

  private async getRevenueData(startDate: Date, endDate: Date) {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(total_amount)', 'total')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    return { total: parseFloat(result?.total) || 0 };
  }

  private async getCommissionData(startDate: Date, endDate: Date) {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(platform_fee)', 'total')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    return { total: parseFloat(result?.total) || 0 };
  }

  private async getPayoutData(startDate: Date, endDate: Date) {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(provider_earnings)', 'total')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    return { total: parseFloat(result?.total) || 0 };
  }

  private async getRefundData(startDate: Date, endDate: Date) {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(total_amount)', 'total')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.CANCELLED })
      .getRawOne();

    return { total: parseFloat(result?.total) || 0 };
  }

  private async getTopProviders(startDate: Date, endDate: Date) {
    return await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.provider', 'provider')
      .select([
        'provider.id',
        'provider.businessName',
        'SUM(booking.total_amount) as totalRevenue',
        'COUNT(booking.id) as bookingCount',
      ])
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .groupBy('provider.id')
      .orderBy('totalRevenue', 'DESC')
      .limit(10)
      .getRawMany();
  }

  private async getTopCategories(startDate: Date, endDate: Date) {
    return await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.service', 'service')
      .leftJoin('service.category', 'category')
      .select([
        'category.id',
        'category.name',
        'SUM(booking.total_amount) as totalRevenue',
        'COUNT(booking.id) as bookingCount',
      ])
      .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('booking.status = :status', { status: BookingStatus.COMPLETED })
      .groupBy('category.id')
      .orderBy('totalRevenue', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
