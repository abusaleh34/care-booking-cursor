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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../../database/entities/booking.entity");
const service_entity_1 = require("../../database/entities/service.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const audit_service_1 = require("../../auth/services/audit.service");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const cache_service_1 = require("../../cache/cache.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
let BookingService = BookingService_1 = class BookingService {
    constructor(bookingRepository, serviceRepository, serviceProviderRepository, auditService, cacheService, realtimeGateway) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.serviceProviderRepository = serviceProviderRepository;
        this.auditService = auditService;
        this.cacheService = cacheService;
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger(BookingService_1.name);
    }
    async createBooking(customerId, createBookingDto, ipAddress, userAgent) {
        try {
            const { providerId, serviceId, bookingDate, startTime, notes } = createBookingDto;
            this.logger.debug(`Creating booking for customer ${customerId}, provider ${providerId}, service ${serviceId}, date ${bookingDate}, time ${startTime}`);
            const service = await this.serviceRepository.findOne({
                where: { id: serviceId, isActive: true },
                relations: ['provider'],
            });
            if (!service) {
                throw new common_1.NotFoundException('Service not found');
            }
            if (service.providerId !== providerId) {
                throw new common_1.BadRequestException('Service does not belong to the specified provider');
            }
            if (service.provider && !service.provider.isActive) {
                throw new common_1.BadRequestException('Service provider is not active');
            }
            if (!service.provider) {
                const provider = await this.serviceProviderRepository.findOne({
                    where: { id: providerId, isActive: true },
                });
                if (!provider) {
                    throw new common_1.BadRequestException('Service provider is not active');
                }
            }
            const endTime = this.calculateEndTime(startTime, service.durationMinutes);
            const isAvailable = await this.checkTimeSlotAvailability(providerId, bookingDate, startTime, endTime);
            if (!isAvailable) {
                throw new common_1.ConflictException('The selected time slot is not available');
            }
            const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
            const now = new Date();
            if (bookingDateTime <= now) {
                throw new common_1.BadRequestException('Booking date must be in the future');
            }
            const maxAdvanceBookingDays = 90;
            const maxBookingDate = new Date();
            maxBookingDate.setDate(maxBookingDate.getDate() + maxAdvanceBookingDays);
            if (bookingDateTime > maxBookingDate) {
                throw new common_1.BadRequestException(`Bookings can only be made up to ${maxAdvanceBookingDays} days in advance`);
            }
            const price = Number(service.price);
            const booking = this.bookingRepository.create({
                customerId,
                providerId,
                serviceId,
                scheduledDate: new Date(bookingDate),
                scheduledTime: startTime,
                duration: service.durationMinutes,
                totalPrice: price,
                platformFee: price * 0.1,
                providerEarnings: price * 0.9,
                customerNotes: notes,
                status: booking_entity_1.BookingStatus.PENDING,
                paymentStatus: booking_entity_1.PaymentStatus.PENDING,
            });
            const savedBooking = await this.bookingRepository.save(booking);
            await this.cacheService.invalidateAvailability(providerId, bookingDate);
            const updatedAvailability = await this.getAvailability({
                providerId,
                serviceId,
                date: bookingDate,
            });
            this.realtimeGateway.notifyAvailabilityChange(providerId, bookingDate, updatedAvailability);
            const bookingWithRelations = await this.bookingRepository.findOne({
                where: { id: savedBooking.id },
                relations: ['service', 'provider'],
            });
            const bookingResult = this.transformBookingResult(bookingWithRelations, service);
            if (bookingWithRelations?.provider?.userId) {
                this.realtimeGateway.notifyNewBooking(bookingResult, bookingWithRelations.provider.userId);
            }
            await this.auditService.log({
                userId: customerId,
                action: audit_log_entity_1.AuditAction.REGISTER,
                description: `Booking created for service ${service.name}`,
                ipAddress,
                userAgent,
                metadata: {
                    bookingId: savedBooking.id,
                    providerId,
                    serviceId,
                    bookingDate,
                    startTime,
                },
            });
            return bookingResult;
        }
        catch (error) {
            this.logger.error(`Error creating booking: ${error.message}`, error.stack);
            this.logger.error('Full error:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to create booking: ${error.message}`);
        }
    }
    async getAvailability(getAvailabilityDto) {
        try {
            const { providerId, serviceId, date } = getAvailabilityDto;
            this.logger.debug(`Getting availability for provider ${providerId}, service ${serviceId}, date ${date}`);
            try {
                const cachedAvailability = await this.cacheService.getAvailability(providerId, serviceId, date);
                if (cachedAvailability) {
                    this.logger.debug(`Returning cached availability for ${providerId} on ${date}`);
                    return cachedAvailability;
                }
            }
            catch (error) {
                this.logger.warn(`Cache error: ${error.message}`);
            }
            const service = await this.serviceRepository.findOne({
                where: { id: serviceId, isActive: true },
            });
            if (!service || service.providerId !== providerId) {
                throw new common_1.NotFoundException('Service not found');
            }
            const timeSlots = this.generateTimeSlots();
            const existingBookings = await this.bookingRepository.find({
                where: {
                    providerId,
                    scheduledDate: new Date(date),
                    status: (0, typeorm_2.In)([booking_entity_1.BookingStatus.PENDING, booking_entity_1.BookingStatus.CONFIRMED, booking_entity_1.BookingStatus.IN_PROGRESS]),
                },
            });
            const availability = timeSlots.map((slot) => {
                const slotStart = this.timeToMinutes(slot.startTime);
                const slotEnd = this.timeToMinutes(slot.endTime);
                const isOccupied = existingBookings.some((booking) => {
                    const bookingStart = this.timeToMinutes(booking.startTime);
                    const bookingEnd = this.timeToMinutes(booking.endTime);
                    return slotStart < bookingEnd && slotEnd > bookingStart;
                });
                return {
                    ...slot,
                    available: !isOccupied,
                };
            });
            await this.cacheService.setAvailability(providerId, serviceId, date, availability, 60);
            return availability;
        }
        catch (error) {
            this.logger.error(`Error getting availability: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getUserBookings(customerId) {
        try {
            this.logger.debug(`Getting bookings for customer ${customerId}`);
            const bookings = await this.bookingRepository.find({
                where: { customerId },
                relations: ['service', 'provider', 'customer', 'customer.profile'],
                order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
            });
            this.logger.debug(`Found ${bookings.length} bookings for customer ${customerId}`);
            return bookings.map((booking) => {
                try {
                    return this.transformBookingResult(booking);
                }
                catch (error) {
                    this.logger.error(`Error transforming booking ${booking.id}: ${error.message}`, error.stack);
                    throw error;
                }
            });
        }
        catch (error) {
            this.logger.error(`Error getting user bookings: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBookingDetails(bookingId, customerId) {
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, customerId },
            relations: ['service', 'provider'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return this.transformBookingResult(booking);
    }
    async cancelBooking(customerId, cancelBookingDto, ipAddress, userAgent) {
        const { bookingId, reason } = cancelBookingDto;
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, customerId },
            relations: ['service', 'provider'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status === booking_entity_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Booking is already cancelled');
        }
        if (booking.status === booking_entity_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed booking');
        }
        const now = new Date();
        const bookingDateTime = new Date(`${booking.scheduledDate.toISOString().split('T')[0]}T${booking.startTime}`);
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilBooking < 24) {
            throw new common_1.ForbiddenException('Bookings can only be cancelled up to 24 hours in advance');
        }
        await this.bookingRepository.update(bookingId, {
            status: booking_entity_1.BookingStatus.CANCELLED,
            notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}` : booking.notes,
        });
        const bookingDate = booking.scheduledDate.toISOString().split('T')[0];
        await this.cacheService.invalidateAvailability(booking.providerId, bookingDate);
        const updatedAvailability = await this.getAvailability({
            providerId: booking.providerId,
            serviceId: booking.serviceId,
            date: bookingDate,
        });
        this.realtimeGateway.notifyAvailabilityChange(booking.providerId, bookingDate, updatedAvailability);
        this.realtimeGateway.notifyBookingCancelled(bookingId, customerId, booking.provider.userId, reason);
        this.realtimeGateway.notifyBookingStatusChange(bookingId, booking_entity_1.BookingStatus.CANCELLED, customerId, booking.provider.userId);
        await this.auditService.log({
            userId: customerId,
            action: audit_log_entity_1.AuditAction.REGISTER,
            description: `Booking cancelled for service ${booking.service.name}`,
            ipAddress,
            userAgent,
            metadata: {
                bookingId,
                reason,
            },
        });
    }
    async rescheduleBooking(customerId, rescheduleBookingDto, ipAddress, userAgent) {
        const { bookingId, newBookingDate, newStartTime, notes } = rescheduleBookingDto;
        const booking = await this.bookingRepository.findOne({
            where: { id: bookingId, customerId },
            relations: ['service', 'provider'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== booking_entity_1.BookingStatus.PENDING && booking.status !== booking_entity_1.BookingStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Only pending or confirmed bookings can be rescheduled');
        }
        const newEndTime = this.calculateEndTime(newStartTime, booking.service.durationMinutes);
        const isAvailable = await this.checkTimeSlotAvailability(booking.providerId, newBookingDate, newStartTime, newEndTime, bookingId);
        if (!isAvailable) {
            throw new common_1.ConflictException('The new time slot is not available');
        }
        const oldDate = booking.scheduledDate.toISOString().split('T')[0];
        await this.bookingRepository.update(bookingId, {
            scheduledDate: new Date(newBookingDate),
            startTime: newStartTime,
            endTime: newEndTime,
            notes: notes || booking.notes,
        });
        await this.cacheService.invalidateAvailability(booking.providerId, oldDate);
        if (oldDate !== newBookingDate) {
            await this.cacheService.invalidateAvailability(booking.providerId, newBookingDate);
        }
        const oldAvailability = await this.getAvailability({
            providerId: booking.providerId,
            serviceId: booking.serviceId,
            date: oldDate,
        });
        this.realtimeGateway.notifyAvailabilityChange(booking.providerId, oldDate, oldAvailability);
        if (oldDate !== newBookingDate) {
            const newAvailability = await this.getAvailability({
                providerId: booking.providerId,
                serviceId: booking.serviceId,
                date: newBookingDate,
            });
            this.realtimeGateway.notifyAvailabilityChange(booking.providerId, newBookingDate, newAvailability);
        }
        const updatedBooking = await this.bookingRepository.findOne({
            where: { id: bookingId },
            relations: ['service', 'provider'],
        });
        this.realtimeGateway.notifyBookingStatusChange(bookingId, updatedBooking.status, customerId, booking.provider.userId);
        await this.auditService.log({
            userId: customerId,
            action: audit_log_entity_1.AuditAction.REGISTER,
            description: `Booking rescheduled for service ${booking.service.name}`,
            ipAddress,
            userAgent,
            metadata: {
                bookingId,
                oldDate: booking.scheduledDate,
                oldTime: booking.startTime,
                newDate: newBookingDate,
                newTime: newStartTime,
            },
        });
        return this.transformBookingResult(updatedBooking);
    }
    async checkTimeSlotAvailability(providerId, date, startTime, endTime, excludeBookingId) {
        const bookings = await this.bookingRepository.find({
            where: {
                providerId,
                scheduledDate: new Date(date),
                status: (0, typeorm_2.In)([booking_entity_1.BookingStatus.PENDING, booking_entity_1.BookingStatus.CONFIRMED, booking_entity_1.BookingStatus.IN_PROGRESS]),
            },
        });
        const relevantBookings = excludeBookingId
            ? bookings.filter(b => b.id !== excludeBookingId)
            : bookings;
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        for (const booking of relevantBookings) {
            const bookingStartMinutes = this.timeToMinutes(booking.scheduledTime);
            const bookingEndMinutes = bookingStartMinutes + booking.duration;
            if (startMinutes < bookingEndMinutes && endMinutes > bookingStartMinutes) {
                return false;
            }
        }
        return true;
    }
    calculateEndTime(startTime, durationMinutes) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + durationMinutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }
    generateTimeSlots() {
        const slots = [];
        const startHour = 9;
        const endHour = 18;
        const intervalMinutes = 30;
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += intervalMinutes) {
                const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const endMinutes = minute + intervalMinutes;
                const endHour = endMinutes >= 60 ? hour + 1 : hour;
                const endMin = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
                const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
                if (endHour <= 18) {
                    slots.push({
                        startTime,
                        endTime,
                        available: true,
                    });
                }
            }
        }
        return slots;
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    transformBookingResult(booking, service) {
        try {
            const scheduledDate = booking.scheduledDate instanceof Date
                ? booking.scheduledDate
                : new Date(booking.scheduledDate);
            const scheduledTime = booking.scheduledTime || '00:00:00';
            const duration = booking.duration || service?.durationMinutes || 60;
            return {
                id: booking.id,
                providerId: booking.providerId,
                serviceId: booking.serviceId,
                bookingDate: scheduledDate.toISOString().split('T')[0],
                startTime: scheduledTime,
                endTime: booking.endTime || this.calculateEndTime(scheduledTime, duration),
                status: booking.status,
                totalAmount: Number(booking.totalPrice) || 0,
                notes: booking.customerNotes || '',
                provider: {
                    id: booking.provider?.id || booking.providerId,
                    businessName: booking.provider?.businessName || '',
                    businessAddress: booking.provider?.businessAddress || '',
                    businessPhone: booking.provider?.businessPhone || '',
                },
                service: {
                    id: booking.service?.id || service?.id || booking.serviceId,
                    name: booking.service?.name || service?.name || '',
                    durationMinutes: booking.service?.durationMinutes || service?.durationMinutes || duration,
                    price: Number(booking.service?.price || service?.price || booking.totalPrice) || 0,
                },
                createdAt: booking.createdAt || new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Error in transformBookingResult for booking ${booking?.id}: ${error.message}`, error.stack);
            throw new Error(`Failed to transform booking result: ${error.message}`);
        }
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __param(2, (0, typeorm_1.InjectRepository)(service_provider_entity_1.ServiceProvider)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService,
        cache_service_1.CacheService,
        websocket_gateway_1.RealtimeGateway])
], BookingService);
//# sourceMappingURL=booking.service.js.map