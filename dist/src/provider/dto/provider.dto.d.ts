import { MessageType } from '../../database/entities/message.entity';
export declare class UpdateBusinessProfileDto {
    businessName?: string;
    businessDescription?: string;
    businessAddress?: string;
    latitude?: number;
    longitude?: number;
    businessPhone?: string;
    businessEmail?: string;
    portfolioImages?: string[];
}
export declare class AvailabilitySlotDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable?: boolean;
}
export declare class SetAvailabilityDto {
    availability: AvailabilitySlotDto[];
}
export declare class BlockTimeDto {
    blockedDate: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
    isRecurring?: boolean;
}
export declare class BookingActionDto {
    action: 'accept' | 'decline' | 'complete';
    reason?: string;
}
export declare class RescheduleRequestDto {
    bookingId: string;
    newDate: string;
    newStartTime: string;
    reason?: string;
}
export declare class SendMessageDto {
    conversationId: string;
    content: string;
    messageType?: MessageType;
    fileUrl?: string;
}
export declare class CreateConversationDto {
    customerId: string;
    bookingId?: string;
    initialMessage: string;
}
export declare class RespondToReviewDto {
    reviewId: string;
    response: string;
}
export declare class PayoutRequestDto {
    amount: number;
    payoutMethod?: string;
    notes?: string;
}
export declare class EarningsFilterDto {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly';
    serviceId?: string;
}
export declare class AnalyticsFilterDto {
    startDate?: string;
    endDate?: string;
    metric?: 'bookings' | 'revenue' | 'ratings' | 'customers';
}
export declare class CreateServiceDto {
    name: string;
    description: string;
    price: number;
    duration: number;
    categoryId?: string;
    images?: string[];
    isActive?: boolean;
}
export declare class UpdateServiceDto {
    name?: string;
    description?: string;
    price?: number;
    duration?: number;
    images?: string[];
    isActive?: boolean;
}
export declare class BookingsQueryDto {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class MessagesQueryDto {
    conversationId?: string;
    page?: number;
    limit?: number;
}
