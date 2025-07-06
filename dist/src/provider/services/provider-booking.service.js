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
var ProviderBookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderBookingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../../database/entities/booking.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const cache_service_1 = require("../../cache/cache.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
let ProviderBookingService = ProviderBookingService_1 = class ProviderBookingService {
    constructor(bookingRepository, providerRepository, cacheService, realtimeGateway) {
        this.bookingRepository = bookingRepository;
        this.providerRepository = providerRepository;
        this.cacheService = cacheService;
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger(ProviderBookingService_1.name);
    }
    async getBookings(providerId, query) {
        try {
            const { status, startDate, endDate, page = 1, limit = 20 } = query;
            const queryBuilder = this.bookingRepository
                .createQueryBuilder('booking')
                .leftJoinAndSelect('booking.customer', 'customer')
                .leftJoinAndSelect('customer.profile', 'profile')
                .leftJoinAndSelect('booking.service', 'service')
                .where('booking.providerId = :providerId', { providerId });
            if (status) {
                queryBuilder.andWhere('booking.status = :status', { status });
            }
            if (startDate) {
                queryBuilder.andWhere('booking.scheduledDate >= :startDate', { startDate });
            }
            if (endDate) {
                queryBuilder.andWhere('booking.scheduledDate <= :endDate', { endDate });
            }
            const total = await queryBuilder.getCount();
            const bookings = await queryBuilder
                .orderBy('booking.scheduledDate', 'DESC')
                .addOrderBy('booking.scheduledTime', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();
            const transformedBookings = bookings.map(booking => ({
                id: booking.id,
                customerName: `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() || 'Unknown',
                serviceName: booking.service?.name || '',
                date: booking.scheduledDate instanceof Date ? booking.scheduledDate.toISOString().split('T')[0] : booking.scheduledDate,
                time: booking.scheduledTime,
                amount: booking.totalPrice,
                status: booking.status,
                customer: {
                    id: booking.customer?.id,
                    firstName: booking.customer?.profile?.firstName || '',
                    lastName: booking.customer?.profile?.lastName || '',
                    email: booking.customer?.email || '',
                    phone: booking.customer?.phone || ''
                },
                service: {
                    id: booking.service?.id,
                    name: booking.service?.name || '',
                    duration: booking.service?.durationMinutes || booking.duration || 0,
                    price: booking.service?.price || booking.totalPrice
                }
            }));
            return { bookings: transformedBookings, total, page, limit };
        }
        catch (error) {
            this.logger.error('Error getting provider bookings:', error);
            throw error;
        }
    }
    async getBookingById(providerId, bookingId) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, providerId },
            relations: ['customer', 'customer.profile', 'service', 'reviews'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async getTodayBookings(providerId) {
        try {
            this.logger.debug(`Getting today's bookings for provider ${providerId}`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.logger.debug(`Today date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
            const bookings = await this.bookingRepository.find({
                where: {
                    providerId,
                    scheduledDate: (0, typeorm_2.Between)(today, tomorrow),
                    status: (0, typeorm_2.In)([booking_entity_1.BookingStatus.PENDING, booking_entity_1.BookingStatus.CONFIRMED, booking_entity_1.BookingStatus.IN_PROGRESS]),
                },
                relations: ['customer', 'customer.profile', 'service'],
                order: { scheduledTime: 'ASC' },
            });
            this.logger.debug(`Found ${bookings.length} bookings for today`);
            return bookings.map(booking => ({
                id: booking.id,
                customerName: `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() || 'Unknown',
                serviceName: booking.service?.name || '',
                date: booking.scheduledDate instanceof Date ? booking.scheduledDate.toISOString().split('T')[0] : booking.scheduledDate,
                time: booking.scheduledTime,
                amount: booking.totalPrice,
                status: booking.status,
                customer: {
                    id: booking.customer?.id,
                    firstName: booking.customer?.profile?.firstName || '',
                    lastName: booking.customer?.profile?.lastName || '',
                    email: booking.customer?.email || '',
                    phone: booking.customer?.phone || ''
                },
                service: {
                    id: booking.service?.id,
                    name: booking.service?.name || '',
                    duration: booking.service?.durationMinutes || booking.duration || 0,
                    price: booking.service?.price || booking.totalPrice
                }
            }));
        }
        catch (error) {
            this.logger.error('Error getting today bookings:', error);
            throw error;
        }
    }
    async getUpcomingBookings(providerId, days = 7) {
        try {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);
            const bookings = await this.bookingRepository.find({
                where: {
                    providerId,
                    scheduledDate: (0, typeorm_2.Between)(today, futureDate),
                    status: (0, typeorm_2.In)([booking_entity_1.BookingStatus.CONFIRMED, booking_entity_1.BookingStatus.IN_PROGRESS]),
                },
                relations: ['customer', 'customer.profile', 'service'],
                order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
            });
            return bookings.map(booking => ({
                id: booking.id,
                customerName: `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() || 'Unknown',
                serviceName: booking.service?.name || '',
                date: booking.scheduledDate instanceof Date ? booking.scheduledDate.toISOString().split('T')[0] : booking.scheduledDate,
                time: booking.scheduledTime,
                amount: booking.totalPrice,
                status: booking.status,
                customer: {
                    id: booking.customer?.id,
                    firstName: booking.customer?.profile?.firstName || '',
                    lastName: booking.customer?.profile?.lastName || '',
                    email: booking.customer?.email || '',
                    phone: booking.customer?.phone || ''
                },
                service: {
                    id: booking.service?.id,
                    name: booking.service?.name || '',
                    duration: booking.service?.durationMinutes || booking.duration || 0,
                    price: booking.service?.price || booking.totalPrice
                }
            }));
        }
        catch (error) {
            this.logger.error('Error getting upcoming bookings:', error);
            throw error;
        }
    }
    async handleBookingAction(providerId, bookingId, action) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, providerId },
            relations: ['customer', 'service'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        let newStatus;
        let allowedCurrentStatuses;
        switch (action.action) {
            case 'accept':
                newStatus = booking_entity_1.BookingStatus.CONFIRMED;
                allowedCurrentStatuses = [booking_entity_1.BookingStatus.PENDING];
                break;
            case 'decline':
                newStatus = booking_entity_1.BookingStatus.CANCELLED;
                allowedCurrentStatuses = [booking_entity_1.BookingStatus.PENDING];
                break;
            case 'complete':
                newStatus = booking_entity_1.BookingStatus.COMPLETED;
                allowedCurrentStatuses = [booking_entity_1.BookingStatus.CONFIRMED, booking_entity_1.BookingStatus.IN_PROGRESS];
                break;
            default:
                throw new common_1.BadRequestException('Invalid action');
        }
        if (!allowedCurrentStatuses.includes(booking.status)) {
            throw new common_1.BadRequestException(`Cannot ${action.action} booking with status ${booking.status}`);
        }
        await this.bookingRepository.update(bookingId, {
            status: newStatus,
            ...(action.reason && { notes: action.reason }),
        });
        const updatedBooking = await this.getBookingById(providerId, bookingId);
        await this.cacheService.invalidateAvailability(providerId);
        this.realtimeGateway.notifyBookingStatusChange(bookingId, newStatus, booking.customerId, providerId);
        if (newStatus === booking_entity_1.BookingStatus.COMPLETED) {
            await this.handleBookingCompletion(booking);
        }
        return updatedBooking;
    }
    async requestReschedule(providerId, rescheduleDto) {
        const booking = await this.bookingRepository.findOne({
            where: { id: rescheduleDto.bookingId, providerId },
            relations: ['customer', 'service'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Can only reschedule confirmed bookings');
        }
        const newDate = new Date(rescheduleDto.newDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (newDate < today) {
            throw new common_1.BadRequestException('Cannot reschedule to a past date');
        }
        this.realtimeGateway.notifyBookingStatusChange(booking.id, 'reschedule_requested', booking.customerId, providerId);
    }
    async startService(providerId, bookingId) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, providerId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Can only start confirmed bookings');
        }
        const now = new Date();
        const bookingDateTime = booking.bookingDateTime;
        const timeDiff = bookingDateTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        if (minutesDiff > 15) {
            throw new common_1.BadRequestException('Cannot start service more than 15 minutes early');
        }
        await this.bookingRepository.update(bookingId, {
            status: booking_entity_1.BookingStatus.IN_PROGRESS,
        });
        const updatedBooking = await this.getBookingById(providerId, bookingId);
        this.realtimeGateway.notifyBookingStatusChange(bookingId, booking_entity_1.BookingStatus.IN_PROGRESS, booking.customerId, providerId);
        return updatedBooking;
    }
    async handleBookingCompletion(booking) {
        await this.updateProviderStats(booking.providerId);
    }
    async updateProviderStats(providerId) {
        const provider = await this.providerRepository.findOne({
            where: { id: providerId },
        });
        if (!provider)
            return;
        const completedBookings = await this.bookingRepository.count({
            where: { providerId, status: booking_entity_1.BookingStatus.COMPLETED },
        });
        await this.cacheService.invalidateProvider(providerId);
    }
    async getProviderCalendar(providerId, startDate, endDate) {
        const bookings = await this.bookingRepository.find({
            where: {
                providerId,
                bookingDate: (0, typeorm_2.Between)(new Date(startDate), new Date(endDate)),
                status: ['confirmed', 'in_progress', 'completed'],
            },
            relations: ['customer', 'customer.profile', 'service'],
            order: { bookingDate: 'ASC', startTime: 'ASC' },
        });
        return bookings.map((booking) => ({
            id: booking.id,
            title: `${booking.service.name} - ${booking.customer.profile?.firstName} ${booking.customer.profile?.lastName}`,
            start: new Date(`${booking.bookingDate}T${booking.startTime}`),
            end: new Date(`${booking.bookingDate}T${booking.endTime}`),
            status: booking.status,
            customerName: `${booking.customer.profile?.firstName} ${booking.customer.profile?.lastName}`,
            serviceName: booking.service.name,
            amount: booking.totalAmount,
            notes: booking.notes,
        }));
    }
    async getBookingConflicts(providerId, date, startTime, endTime, excludeBookingId) {
        const query = this.bookingRepository
            .createQueryBuilder('booking')
            .where('booking.providerId = :providerId', { providerId })
            .andWhere('booking.bookingDate = :date', { date })
            .andWhere('booking.status IN (:...statuses)', {
            statuses: ['confirmed', 'in_progress'],
        })
            .andWhere('(booking.startTime < :endTime AND booking.endTime > :startTime)', {
            startTime,
            endTime,
        });
        if (excludeBookingId) {
            query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
        }
        return await query.getMany();
    }
};
exports.ProviderBookingService = ProviderBookingService;
exports.ProviderBookingService = ProviderBookingService = ProviderBookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService,
        websocket_gateway_1.RealtimeGateway])
], ProviderBookingService);
//# sourceMappingURL=provider-booking.service.js.map