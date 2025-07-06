import { Request } from 'express';
import { SearchService } from '../services/search.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';
import { GetProviderDetailsDto, SearchProvidersDto } from '../dto/search-providers.dto';
import { CancelBookingDto, CreateBookingDto, GetAvailabilityDto, PaymentDto, RescheduleBookingDto } from '../dto/create-booking.dto';
export declare class CustomerController {
    private readonly searchService;
    private readonly bookingService;
    private readonly paymentService;
    constructor(searchService: SearchService, bookingService: BookingService, paymentService: PaymentService);
    getCategories(): Promise<{
        success: boolean;
        data: any[];
    }>;
    searchProviders(searchDto: SearchProvidersDto): Promise<{
        success: boolean;
        data: import("../services/search.service").SearchResult;
    }>;
    getProviderDetails(params: GetProviderDetailsDto): Promise<{
        success: boolean;
        data: import("../services/search.service").ServiceProviderResult;
    }>;
    getAvailability(getAvailabilityDto: GetAvailabilityDto): Promise<{
        success: boolean;
        data: import("../services/booking.service").AvailabilitySlot[];
    }>;
    createBooking(createBookingDto: CreateBookingDto, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
        data: import("../services/booking.service").BookingResult;
    }>;
    getUserBookings(user: any): Promise<{
        success: boolean;
        data: import("../services/booking.service").BookingResult[];
    }>;
    getBookingDetails(bookingId: string, user: any): Promise<{
        success: boolean;
        data: import("../services/booking.service").BookingResult;
    }>;
    rescheduleBooking(bookingId: string, rescheduleBookingDto: Omit<RescheduleBookingDto, 'bookingId'>, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
        data: import("../services/booking.service").BookingResult;
    }>;
    cancelBooking(bookingId: string, cancelDto: Omit<CancelBookingDto, 'bookingId'>, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    getCustomerProfile(user: any): Promise<{
        success: boolean;
        data: {
            id: any;
            email: any;
            profile: any;
            roles: any;
            isVerified: any;
        };
    }>;
    processPayment(paymentDto: PaymentDto, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
        data: import("../services/payment.service").PaymentResult;
    }>;
    confirmPayment(paymentIntentId: string, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
        data: import("../services/payment.service").PaymentResult;
    }>;
    processRefund(body: {
        bookingId: string;
        reason: string;
    }, user: any, req: Request): Promise<{
        success: boolean;
        message: string;
        data: import("../services/payment.service").RefundResult;
    }>;
    handleStripeWebhook(signature: string, payload: Buffer): Promise<{
        received: boolean;
    }>;
    getRecommendations(user: any, query: {
        latitude?: number;
        longitude?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../services/search.service").SearchResult;
    }>;
    getSearchSuggestions(query: string): Promise<{
        success: boolean;
        data: string[];
    }>;
}
