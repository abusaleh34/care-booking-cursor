export declare class CreateBookingDto {
    providerId: string;
    serviceId: string;
    bookingDate: string;
    startTime: string;
    notes?: string;
}
export declare class GetAvailabilityDto {
    providerId: string;
    serviceId: string;
    date: string;
}
export declare class CancelBookingDto {
    bookingId: string;
    reason?: string;
}
export declare class RescheduleBookingDto {
    bookingId: string;
    newBookingDate: string;
    newStartTime: string;
    notes?: string;
}
export declare class PaymentDto {
    bookingId: string;
    paymentMethodId: string;
    tipAmount?: number;
}
