import { ProviderDashboardService } from './services/provider-dashboard.service';
import { ProviderBusinessService } from './services/provider-business.service';
import { ProviderBookingService } from './services/provider-booking.service';
import { ProviderMessagingService } from './services/provider-messaging.service';
import { AnalyticsFilterDto, BlockTimeDto, BookingActionDto, BookingsQueryDto, CreateConversationDto, CreateServiceDto, EarningsFilterDto, MessagesQueryDto, RescheduleRequestDto, SendMessageDto, SetAvailabilityDto, UpdateBusinessProfileDto, UpdateServiceDto } from './dto/provider.dto';
export declare class ProviderController {
    private readonly dashboardService;
    private readonly businessService;
    private readonly bookingService;
    private readonly messagingService;
    private getProviderId;
    constructor(dashboardService: ProviderDashboardService, businessService: ProviderBusinessService, bookingService: ProviderBookingService, messagingService: ProviderMessagingService);
    getDashboard(req: any): Promise<import("./services/provider-dashboard.service").DashboardOverview>;
    getAnalytics(req: any, filter: AnalyticsFilterDto): Promise<import("./services/provider-dashboard.service").AnalyticsData>;
    getEarnings(req: any, filter: EarningsFilterDto): Promise<import("./services/provider-dashboard.service").EarningsData>;
    getBusinessProfile(req: any): Promise<import("../database/entities").ServiceProvider>;
    updateBusinessProfile(req: any, updateData: UpdateBusinessProfileDto): Promise<import("../database/entities").ServiceProvider>;
    getServices(req: any): Promise<import("../database/entities").Service[]>;
    createService(req: any, createServiceDto: CreateServiceDto): Promise<import("../database/entities").Service>;
    updateService(req: any, serviceId: string, updateServiceDto: UpdateServiceDto): Promise<import("../database/entities").Service>;
    deleteService(req: any, serviceId: string): Promise<void>;
    getServicePerformance(req: any): Promise<any[]>;
    getAvailability(req: any): Promise<import("../database/entities").ProviderAvailability[]>;
    setAvailability(req: any, setAvailabilityDto: SetAvailabilityDto): Promise<import("../database/entities").ProviderAvailability[]>;
    getBlockedTimes(req: any, startDate?: string, endDate?: string): Promise<import("../database/entities").ProviderBlockedTimes[]>;
    blockTime(req: any, blockTimeDto: BlockTimeDto): Promise<import("../database/entities").ProviderBlockedTimes>;
    unblockTime(req: any, blockedTimeId: string): Promise<void>;
    getBookings(req: any, query: BookingsQueryDto): Promise<{
        bookings: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    getTodayBookings(req: any): Promise<any[]>;
    getUpcomingBookings(req: any, days?: number): Promise<any[]>;
    getBookingById(req: any, bookingId: string): Promise<import("../database/entities").Booking>;
    handleBookingAction(req: any, bookingId: string, action: BookingActionDto): Promise<import("../database/entities").Booking>;
    startService(req: any, bookingId: string): Promise<import("../database/entities").Booking>;
    requestReschedule(req: any, rescheduleDto: RescheduleRequestDto): Promise<{
        message: string;
    }>;
    getProviderCalendar(req: any, startDate: string, endDate: string): Promise<any[]>;
    getConversations(req: any): Promise<import("../database/entities").Conversation[]>;
    createConversation(req: any, createConversationDto: CreateConversationDto): Promise<import("../database/entities").Conversation>;
    getConversationById(req: any, conversationId: string): Promise<import("../database/entities").Conversation>;
    getMessages(req: any, conversationId: string, query: MessagesQueryDto): Promise<{
        messages: import("../database/entities").Message[];
        total: number;
        page: number;
        limit: number;
    }>;
    sendMessage(req: any, conversationId: string, sendMessageDto: Omit<SendMessageDto, 'conversationId'>): Promise<import("../database/entities").Message>;
    markMessagesAsRead(req: any, conversationId: string): Promise<void>;
    getConversationStats(req: any): Promise<any>;
    searchConversations(req: any, searchTerm: string): Promise<import("../database/entities").Conversation[]>;
    uploadPortfolioImage(req: any, imageUrl: string): Promise<import("../database/entities").ServiceProvider>;
    deletePortfolioImage(req: any, imageUrl: string): Promise<void>;
}
