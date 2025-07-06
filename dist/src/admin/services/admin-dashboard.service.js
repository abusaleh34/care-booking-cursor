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
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const booking_entity_1 = require("../../database/entities/booking.entity");
const dispute_entity_1 = require("../../database/entities/dispute.entity");
const review_entity_1 = require("../../database/entities/review.entity");
const booking_entity_2 = require("../../database/entities/booking.entity");
const dispute_entity_2 = require("../../database/entities/dispute.entity");
let AdminDashboardService = class AdminDashboardService {
    constructor(userRepository, providerRepository, bookingRepository, disputeRepository, reviewRepository) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.bookingRepository = bookingRepository;
        this.disputeRepository = disputeRepository;
        this.reviewRepository = reviewRepository;
    }
    async getDashboardOverview(filter) {
        const { startDate, endDate } = this.getDateRange(filter);
        const [platformMetrics, userMetrics, bookingMetrics, financialMetrics, recentActivity] = await Promise.all([
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
    async getGrowthAnalytics(filter) {
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
    async getFinancialOverview(filter) {
        const { startDate, endDate } = this.getDateRange(filter);
        const [revenue, commissions, payouts, refunds, topProviders, topCategories] = await Promise.all([
            this.getRevenueData(startDate, endDate),
            this.getCommissionData(startDate, endDate),
            this.getPayoutData(startDate, endDate),
            this.getRefundData(startDate, endDate),
            this.getTopProviders(startDate, endDate),
            this.getTopCategories(startDate, endDate),
        ]);
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
    async getPlatformMetrics(startDate, endDate) {
        const [totalUsers, totalProviders, totalBookings, activeUsers, completedBookings] = await Promise.all([
            this.userRepository.count(),
            this.providerRepository.count(),
            this.bookingRepository.count(),
            this.userRepository.count({
                where: {
                    lastLoginAt: (0, typeorm_2.Between)(startDate, endDate),
                },
            }),
            this.bookingRepository.count({
                where: {
                    status: booking_entity_2.BookingStatus.COMPLETED,
                    updatedAt: (0, typeorm_2.Between)(startDate, endDate),
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
    async getUserMetrics(startDate, endDate) {
        const [newUsers, newProviders, verifiedProviders, suspendedUsers] = await Promise.all([
            this.userRepository.count({
                where: {
                    createdAt: (0, typeorm_2.Between)(startDate, endDate),
                },
            }),
            this.providerRepository.count({
                where: {
                    createdAt: (0, typeorm_2.Between)(startDate, endDate),
                },
            }),
            this.providerRepository.count({
                where: {
                    isVerified: true,
                    createdAt: (0, typeorm_2.Between)(startDate, endDate),
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
    async getBookingMetrics(startDate, endDate) {
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
    async getFinancialMetrics(startDate, endDate) {
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
            netRevenue: (parseFloat(financial.totalRevenue) || 0) - (parseFloat(financial.refundAmount) || 0),
        };
    }
    async getRecentActivity(limit) {
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
    getDateRange(filter) {
        const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
        let startDate;
        if (filter.startDate) {
            startDate = new Date(filter.startDate);
        }
        else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }
        return { startDate, endDate };
    }
    async getUserGrowthData(startDate, endDate, timeframe) {
        return [];
    }
    async getProviderGrowthData(startDate, endDate, timeframe) {
        return [];
    }
    async getBookingGrowthData(startDate, endDate, timeframe) {
        return [];
    }
    async getRevenueGrowthData(startDate, endDate, timeframe) {
        return [];
    }
    async getPendingDisputes() {
        return await this.disputeRepository.count({
            where: { status: dispute_entity_2.DisputeStatus.OPEN },
        });
    }
    async getPendingVerifications() {
        return 0;
    }
    async getSystemAlerts() {
        return [];
    }
    calculateHealthStatus(disputes, verifications, flagged) {
        const totalIssues = disputes + verifications + flagged;
        if (totalIssues === 0)
            return 'excellent';
        if (totalIssues < 10)
            return 'good';
        if (totalIssues < 50)
            return 'warning';
        return 'critical';
    }
    async getRevenueData(startDate, endDate) {
        const result = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(total_amount)', 'total')
            .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.COMPLETED })
            .getRawOne();
        return { total: parseFloat(result?.total) || 0 };
    }
    async getCommissionData(startDate, endDate) {
        const result = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(platform_fee)', 'total')
            .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.COMPLETED })
            .getRawOne();
        return { total: parseFloat(result?.total) || 0 };
    }
    async getPayoutData(startDate, endDate) {
        const result = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(provider_earnings)', 'total')
            .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.COMPLETED })
            .getRawOne();
        return { total: parseFloat(result?.total) || 0 };
    }
    async getRefundData(startDate, endDate) {
        const result = await this.bookingRepository
            .createQueryBuilder('booking')
            .select('SUM(total_amount)', 'total')
            .where('booking.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.CANCELLED })
            .getRawOne();
        return { total: parseFloat(result?.total) || 0 };
    }
    async getTopProviders(startDate, endDate) {
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
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.COMPLETED })
            .groupBy('provider.id')
            .orderBy('totalRevenue', 'DESC')
            .limit(10)
            .getRawMany();
    }
    async getTopCategories(startDate, endDate) {
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
            .andWhere('booking.status = :status', { status: booking_entity_2.BookingStatus.COMPLETED })
            .groupBy('category.id')
            .orderBy('totalRevenue', 'DESC')
            .limit(10)
            .getRawMany();
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __param(2, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(3, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(4, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map