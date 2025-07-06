import { Booking } from './booking.entity';
import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';
export declare class Review {
    id: string;
    booking_id: string;
    customer_id: string;
    provider_id: string;
    rating: number;
    comment: string;
    images: string[];
    is_visible: boolean;
    created_at: Date;
    booking: Booking;
    customer: User;
    provider: ServiceProvider;
}
