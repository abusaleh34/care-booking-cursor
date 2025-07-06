import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
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

@Injectable()
export class ProviderDashboardService {
  constructor(
    @InjectRepository(ServiceProvider)
    private readonly providerRepository: Repository<ServiceProvider>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly cacheService: CacheService,
  ) {}

  async getDashboardOverview(providerId: string): Promise<DashboardOverview> {
    const cacheKey = `dashboard_overview_${providerId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached as DashboardOverview;

    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['services', 'reviews'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Get booking statistics
    const totalBookings = await this.bookingRepository.count({
      where: { providerId },
    });

    const pendingBookings = await this.bookingRepository.count({
      where: { providerId, status: BookingStatus.PENDING },
    });

    const completedBookings = await this.bookingRepository.count({
      where: { providerId, status: BookingStatus.COMPLETED },
    });

    // Calculate earnings
    const completedBookingsList = await this.bookingRepository.find({
      where: { providerId, status: BookingStatus.COMPLETED },
      select: ['totalPrice', 'createdAt'],
    });

    const totalEarnings = completedBookingsList.reduce(
      (sum, booking) => sum + Number(booking.totalPrice),
      0,
    );

    // Monthly earnings (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyBookings = await this.bookingRepository.find({
      where: {
        providerId,
        status: BookingStatus.COMPLETED,
        createdAt: Between(currentMonth, nextMonth),
      },
      select: ['totalPrice'],
    });

    const monthlyEarnings = monthlyBookings.reduce(
      (sum, booking) => sum + Number(booking.totalPrice),
      0,
    );

    // Recent bookings
    const recentBookings = await this.bookingRepository.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['customer', 'customer.profile', 'service'],
    });

    // Generate earnings chart (last 12 months)
    const earningsChart = await this.generateEarningsChart(providerId);

    // Generate rating trend
    const ratingTrend = await this.generateRatingTrend(providerId);

    const overview: DashboardOverview = {
      totalBookings,
      pendingBookings,
      completedBookings,
      totalEarnings,
      monthlyEarnings,
      averageRating: provider.averageRating || 0,
      totalReviews: provider.totalReviews || 0,
      activeServices: provider.services?.filter((s) => s.isActive).length || 0,
      unreadMessages: 0, // TODO: Implement message counting
      recentBookings: recentBookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customer?.profile ? 
          `${booking.customer.profile.firstName} ${booking.customer.profile.lastName}` : 'Unknown',
        serviceName: booking.service?.name,
        date: booking.scheduledDate,
        time: booking.scheduledTime,
        amount: booking.totalPrice,
        status: booking.status,
      })),
      earningsChart,
      ratingTrend,
    };

    // Cache for 10 minutes
    await this.cacheService.set(cacheKey, overview, 600);
    return overview;
  }

  async getEarningsData(providerId: string, filter: EarningsFilterDto): Promise<EarningsData> {
    const startDate = filter.startDate ? new Date(filter.startDate) : new Date();
    let endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    if (!filter.startDate && !filter.endDate) {
      // Default to current month
      startDate.setDate(1);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const bookings = await this.bookingRepository.find({
      where: {
        providerId,
        status: BookingStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
        ...(filter.serviceId && { serviceId: filter.serviceId }),
      },
      relations: ['service'],
    });

    const grossEarnings = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

    const commissionRate = 0.1; // 10% platform commission
    const netEarnings = grossEarnings * (1 - commissionRate);

    // Generate earnings breakdown by period
    const earningsBreakdown = this.generateEarningsBreakdown(bookings, filter.period || 'daily');

    return {
      totalEarnings: grossEarnings,
      periodEarnings: grossEarnings,
      earningsBreakdown,
      payoutsPending: 0, // TODO: Implement payout tracking
      payoutsCompleted: 0,
      commissionRate,
      grossEarnings,
      netEarnings,
    };
  }

  async getAnalyticsData(providerId: string, filter: AnalyticsFilterDto): Promise<AnalyticsData> {
    const cacheKey = `analytics_${providerId}_${JSON.stringify(filter)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached as AnalyticsData;

    const startDate = filter.startDate ? new Date(filter.startDate) : new Date();
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    if (!filter.startDate && !filter.endDate) {
      // Default to last 3 months
      startDate.setMonth(startDate.getMonth() - 3);
    }

    const bookings = await this.bookingRepository.find({
      where: {
        providerId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['customer', 'service', 'reviews'],
    });

    const bookingTrends = this.generateBookingTrends(bookings);
    const revenueTrends = this.generateRevenueTrends(bookings);
    const ratingTrends = this.generateRatingTrends(bookings);
    const customerInsights = this.generateCustomerInsights(bookings);
    const servicePerformance = this.generateServicePerformance(bookings);
    const peakHours = this.generatePeakHours(bookings);

    const totalBookings = bookings.length;
    const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;
    const cancellationRate = totalBookings > 0 ? cancelledBookings / totalBookings : 0;

    const uniqueCustomers = new Set(bookings.map((b) => b.customerId));
    const repeatCustomers = bookings.filter(
      (b) => bookings.filter((bb) => bb.customerId === b.customerId).length > 1,
    ).length;

    const analytics: AnalyticsData = {
      bookingTrends,
      revenueTrends,
      ratingTrends,
      customerInsights,
      servicePerformance,
      peakHours,
      cancellationRate,
      repeatCustomers: uniqueCustomers.size - repeatCustomers,
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, analytics, 3600);
    return analytics;
  }

  private async generateEarningsChart(providerId: string): Promise<any[]> {
    const chart = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const bookings = await this.bookingRepository.find({
        where: {
          providerId,
          status: BookingStatus.COMPLETED,
          createdAt: Between(monthStart, monthEnd),
        },
      });

      const earnings = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

      chart.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        earnings,
        bookings: bookings.length,
      });
    }

    return chart;
  }

  private async generateRatingTrend(providerId: string): Promise<any[]> {
    // TODO: Implement rating trend based on reviews over time
    return [];
  }

  private generateEarningsBreakdown(bookings: any[], period: string): any[] {
    const breakdown = new Map();

    bookings.forEach((booking) => {
      let key: string;
      const date = new Date(booking.createdAt);

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const week = this.getWeekNumber(date);
          key = `Week ${week}`;
          break;
        case 'monthly':
          key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!breakdown.has(key)) {
        breakdown.set(key, { period: key, earnings: 0, bookings: 0 });
      }

      const entry = breakdown.get(key);
      entry.earnings += Number(booking.totalPrice);
      entry.bookings += 1;
    });

    return Array.from(breakdown.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private generateBookingTrends(bookings: any[]): any[] {
    // Group bookings by date and count
    const trends = new Map();

    bookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      trends.set(date, (trends.get(date) || 0) + 1);
    });

    return Array.from(trends.entries()).map(([date, count]) => ({
      date,
      bookings: count,
    }));
  }

  private generateRevenueTrends(bookings: any[]): any[] {
    const trends = new Map();

    bookings.forEach((booking) => {
      if (booking.status === BookingStatus.COMPLETED) {
        const date = booking.createdAt.toISOString().split('T')[0];
        trends.set(date, (trends.get(date) || 0) + Number(booking.totalPrice));
      }
    });

    return Array.from(trends.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  private generateRatingTrends(bookings: any[]): any[] {
    // TODO: Implement based on reviews
    return [];
  }

  private generateCustomerInsights(bookings: any[]): any {
    const customers = new Map();

    bookings.forEach((booking) => {
      if (!customers.has(booking.customerId)) {
        customers.set(booking.customerId, {
          id: booking.customerId,
          bookings: 0,
          totalSpent: 0,
        });
      }

      const customer = customers.get(booking.customerId);
      customer.bookings += 1;
      if (booking.status === BookingStatus.COMPLETED) {
        customer.totalSpent += Number(booking.totalPrice);
      }
    });

    const customerList = Array.from(customers.values());

    return {
      totalCustomers: customerList.length,
      averageBookingsPerCustomer:
        customerList.reduce((sum, c) => sum + c.bookings, 0) / customerList.length,
      averageSpendPerCustomer:
        customerList.reduce((sum, c) => sum + c.totalSpent, 0) / customerList.length,
      topCustomers: customerList.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    };
  }

  private generateServicePerformance(bookings: any[]): any[] {
    const services = new Map();

    bookings.forEach((booking) => {
      if (!services.has(booking.serviceId)) {
        services.set(booking.serviceId, {
          serviceId: booking.serviceId,
          serviceName: booking.service?.name || 'Unknown',
          bookings: 0,
          revenue: 0,
          completedBookings: 0,
        });
      }

      const service = services.get(booking.serviceId);
      service.bookings += 1;

      if (booking.status === BookingStatus.COMPLETED) {
        service.completedBookings += 1;
        service.revenue += Number(booking.totalPrice);
      }
    });

    return Array.from(services.values()).map((service) => ({
      ...service,
      completionRate: service.bookings > 0 ? service.completedBookings / service.bookings : 0,
      averageRevenue:
        service.completedBookings > 0 ? service.revenue / service.completedBookings : 0,
    }));
  }

  private generatePeakHours(bookings: any[]): any[] {
    const hours = new Array(24).fill(0);

    bookings.forEach((booking) => {
      if (booking.scheduledTime) {
        const hour = parseInt(booking.scheduledTime.split(':')[0]);
        hours[hour] += 1;
      }
    });

    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      bookings: count,
    }));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
