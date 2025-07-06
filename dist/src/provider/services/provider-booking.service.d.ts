import { Repository } from 'typeorm';
import { Booking } from '../../database/entities/booking.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { BookingActionDto, BookingsQueryDto, RescheduleRequestDto } from '../dto/provider.dto';
export declare class ProviderBookingService {
    private readonly bookingRepository;
    private readonly providerRepository;
    private readonly cacheService;
    private readonly realtimeGateway;
    private readonly logger;
    constructor(bookingRepository: Repository<Booking>, providerRepository: Repository<ServiceProvider>, cacheService: CacheService, realtimeGateway: RealtimeGateway);
    getBookings(providerId: string, query: BookingsQueryDto): Promise<{
        bookings: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getBookingById(providerId: string, bookingId: string): Promise<Booking>;
    getTodayBookings(providerId: string): Promise<any[]>;
    getUpcomingBookings(providerId: string, days?: number): Promise<any[]>;
    handleBookingAction(providerId: string, bookingId: string, action: BookingActionDto): Promise<Booking>;
    requestReschedule(providerId: string, rescheduleDto: RescheduleRequestDto): Promise<void>;
    startService(providerId: string, bookingId: string): Promise<Booking>;
    private handleBookingCompletion;
    private updateProviderStats;
    getProviderCalendar(providerId: string, startDate: string, endDate: string): Promise<any[]>;
    getBookingConflicts(providerId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string): Promise<Booking[]>;
}
