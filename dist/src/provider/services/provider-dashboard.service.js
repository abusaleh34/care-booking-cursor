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
exports.ProviderDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const booking_entity_1 = require("../../database/entities/booking.entity");
const cache_service_1 = require("../../cache/cache.service");
let ProviderDashboardService = class ProviderDashboardService {
    constructor(providerRepository, bookingRepository, cacheService) {
        this.providerRepository = providerRepository;
        this.bookingRepository = bookingRepository;
        this.cacheService = cacheService;
    }
    async getDashboardOverview(providerId) {
        const cacheKey = `dashboard_overview_${providerId}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
            relations: ['services', 'reviews'],
        });
        if (!provider) {
            throw new common_1.NotFoundException('Provider not found');
        }
        const totalBookings = await this.bookingRepository.count({
            where: { providerId },
        });
        const pendingBookings = await this.bookingRepository.count({
            where: { providerId, status: booking_entity_1.BookingStatus.PENDING },
        });
        const completedBookings = await this.bookingRepository.count({
            where: { providerId, status: booking_entity_1.BookingStatus.COMPLETED },
        });
        const completedBookingsList = await this.bookingRepository.find({
            where: { providerId, status: booking_entity_1.BookingStatus.COMPLETED },
            select: ['totalPrice', 'createdAt'],
        });
        const totalEarnings = completedBookingsList.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthlyBookings = await this.bookingRepository.find({
            where: {
                providerId,
                status: booking_entity_1.BookingStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(currentMonth, nextMonth),
            },
            select: ['totalPrice'],
        });
        const monthlyEarnings = monthlyBookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
        const recentBookings = await this.bookingRepository.find({
            where: { providerId },
            order: { createdAt: 'DESC' },
            take: 5,
            relations: ['customer', 'customer.profile', 'service'],
        });
        const earningsChart = await this.generateEarningsChart(providerId);
        const ratingTrend = await this.generateRatingTrend(providerId);
        const overview = {
            totalBookings,
            pendingBookings,
            completedBookings,
            totalEarnings,
            monthlyEarnings,
            averageRating: provider.averageRating || 0,
            totalReviews: provider.totalReviews || 0,
            activeServices: provider.services?.filter((s) => s.isActive).length || 0,
            unreadMessages: 0,
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
        await this.cacheService.set(cacheKey, overview, 600);
        return overview;
    }
    async getEarningsData(providerId, filter) {
        const startDate = filter.startDate ? new Date(filter.startDate) : new Date();
        let endDate = filter.endDate ? new Date(filter.endDate) : new Date();
        if (!filter.startDate && !filter.endDate) {
            startDate.setDate(1);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }
        const bookings = await this.bookingRepository.find({
            where: {
                providerId,
                status: booking_entity_1.BookingStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
                ...(filter.serviceId && { serviceId: filter.serviceId }),
            },
            relations: ['service'],
        });
        const grossEarnings = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
        const commissionRate = 0.1;
        const netEarnings = grossEarnings * (1 - commissionRate);
        const earningsBreakdown = this.generateEarningsBreakdown(bookings, filter.period || 'daily');
        return {
            totalEarnings: grossEarnings,
            periodEarnings: grossEarnings,
            earningsBreakdown,
            payoutsPending: 0,
            payoutsCompleted: 0,
            commissionRate,
            grossEarnings,
            netEarnings,
        };
    }
    async getAnalyticsData(providerId, filter) {
        const cacheKey = `analytics_${providerId}_${JSON.stringify(filter)}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const startDate = filter.startDate ? new Date(filter.startDate) : new Date();
        const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
        if (!filter.startDate && !filter.endDate) {
            startDate.setMonth(startDate.getMonth() - 3);
        }
        const bookings = await this.bookingRepository.find({
            where: {
                providerId,
                createdAt: (0, typeorm_2.Between)(startDate, endDate),
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
        const cancelledBookings = bookings.filter((b) => b.status === booking_entity_1.BookingStatus.CANCELLED).length;
        const cancellationRate = totalBookings > 0 ? cancelledBookings / totalBookings : 0;
        const uniqueCustomers = new Set(bookings.map((b) => b.customerId));
        const repeatCustomers = bookings.filter((b) => bookings.filter((bb) => bb.customerId === b.customerId).length > 1).length;
        const analytics = {
            bookingTrends,
            revenueTrends,
            ratingTrends,
            customerInsights,
            servicePerformance,
            peakHours,
            cancellationRate,
            repeatCustomers: uniqueCustomers.size - repeatCustomers,
        };
        await this.cacheService.set(cacheKey, analytics, 3600);
        return analytics;
    }
    async generateEarningsChart(providerId) {
        const chart = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const bookings = await this.bookingRepository.find({
                where: {
                    providerId,
                    status: booking_entity_1.BookingStatus.COMPLETED,
                    createdAt: (0, typeorm_2.Between)(monthStart, monthEnd),
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
    async generateRatingTrend(providerId) {
        return [];
    }
    generateEarningsBreakdown(bookings, period) {
        const breakdown = new Map();
        bookings.forEach((booking) => {
            let key;
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
    generateBookingTrends(bookings) {
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
    generateRevenueTrends(bookings) {
        const trends = new Map();
        bookings.forEach((booking) => {
            if (booking.status === booking_entity_1.BookingStatus.COMPLETED) {
                const date = booking.createdAt.toISOString().split('T')[0];
                trends.set(date, (trends.get(date) || 0) + Number(booking.totalPrice));
            }
        });
        return Array.from(trends.entries()).map(([date, revenue]) => ({
            date,
            revenue,
        }));
    }
    generateRatingTrends(bookings) {
        return [];
    }
    generateCustomerInsights(bookings) {
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
            if (booking.status === booking_entity_1.BookingStatus.COMPLETED) {
                customer.totalSpent += Number(booking.totalPrice);
            }
        });
        const customerList = Array.from(customers.values());
        return {
            totalCustomers: customerList.length,
            averageBookingsPerCustomer: customerList.reduce((sum, c) => sum + c.bookings, 0) / customerList.length,
            averageSpendPerCustomer: customerList.reduce((sum, c) => sum + c.totalSpent, 0) / customerList.length,
            topCustomers: customerList.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
        };
    }
    generateServicePerformance(bookings) {
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
            if (booking.status === booking_entity_1.BookingStatus.COMPLETED) {
                service.completedBookings += 1;
                service.revenue += Number(booking.totalPrice);
            }
        });
        return Array.from(services.values()).map((service) => ({
            ...service,
            completionRate: service.bookings > 0 ? service.completedBookings / service.bookings : 0,
            averageRevenue: service.completedBookings > 0 ? service.revenue / service.completedBookings : 0,
        }));
    }
    generatePeakHours(bookings) {
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
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
};
exports.ProviderDashboardService = ProviderDashboardService;
exports.ProviderDashboardService = ProviderDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(1, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService])
], ProviderDashboardService);
//# sourceMappingURL=provider-dashboard.service.js.map