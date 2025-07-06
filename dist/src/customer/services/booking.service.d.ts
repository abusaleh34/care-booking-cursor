import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { CancelBookingDto, CreateBookingDto, GetAvailabilityDto, RescheduleBookingDto } from '../dto/create-booking.dto';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
export interface AvailabilitySlot {
    startTime: string;
    endTime: string;
    available: boolean;
}
export interface BookingResult {
    id: string;
    providerId: string;
    serviceId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    totalAmount: number;
    notes?: string;
    provider: {
        id: string;
        businessName: string;
        businessAddress: string;
        businessPhone: string;
    };
    service: {
        id: string;
        name: string;
        durationMinutes: number;
        price: number;
    };
    createdAt: Date;
}
export declare class BookingService {
    private readonly bookingRepository;
    private readonly serviceRepository;
    private readonly serviceProviderRepository;
    private readonly auditService;
    private readonly cacheService;
    private readonly realtimeGateway;
    private readonly logger;
    constructor(bookingRepository: Repository<Booking>, serviceRepository: Repository<Service>, serviceProviderRepository: Repository<ServiceProvider>, auditService: AuditService, cacheService: CacheService, realtimeGateway: RealtimeGateway);
    createBooking(customerId: string, createBookingDto: CreateBookingDto, ipAddress: string, userAgent: string): Promise<BookingResult>;
    getAvailability(getAvailabilityDto: GetAvailabilityDto): Promise<AvailabilitySlot[]>;
    getUserBookings(customerId: string): Promise<BookingResult[]>;
    getBookingDetails(bookingId: string, customerId: string): Promise<BookingResult>;
    cancelBooking(customerId: string, cancelBookingDto: CancelBookingDto, ipAddress: string, userAgent: string): Promise<void>;
    rescheduleBooking(customerId: string, rescheduleBookingDto: RescheduleBookingDto, ipAddress: string, userAgent: string): Promise<BookingResult>;
    private checkTimeSlotAvailability;
    private calculateEndTime;
    private generateTimeSlots;
    private timeToMinutes;
    private transformBookingResult;
}
