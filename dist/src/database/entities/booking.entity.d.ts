import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';
import { Service } from './service.entity';
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare class Booking {
    id: string;
    customerId: string;
    customer: User;
    providerId: string;
    provider: ServiceProvider;
    serviceId: string;
    service: Service;
    status: BookingStatus;
    scheduledDate: Date;
    scheduledTime: string;
    duration: number;
    totalPrice: number;
    get bookingDate(): Date;
    set bookingDate(value: Date);
    get startTime(): string;
    set startTime(value: string);
    get endTime(): string;
    get totalAmount(): number;
    set totalAmount(value: number);
    get notes(): string;
    set notes(value: string);
    platformFee: number;
    providerEarnings: number;
    paymentStatus: PaymentStatus;
    paymentIntentId: string;
    customerNotes: string;
    providerNotes: string;
    cancellationReason: string;
    cancelledAt: Date;
    completedAt: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    scheduledDateCheck: any;
    totalPriceCheck: any;
    durationCheck: any;
    reviews: any[];
    get bookingDateTime(): Date;
    get formattedAmount(): string;
}
