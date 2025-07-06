import { Booking } from './booking.entity';
import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';
import { Message } from './message.entity';
export declare class Conversation {
    id: string;
    booking_id: string;
    customer_id: string;
    provider_id: string;
    created_at: Date;
    booking: Booking;
    customer: User;
    provider: ServiceProvider;
    messages: Message[];
}
