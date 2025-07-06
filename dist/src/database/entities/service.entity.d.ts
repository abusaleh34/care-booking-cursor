import { ServiceProvider } from './service-provider.entity';
import { ServiceCategory } from './service-category.entity';
import { Booking } from './booking.entity';
export declare class Service {
    id: string;
    providerId: string;
    categoryId: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    isHomeService: boolean;
    isActive: boolean;
    createdAt: Date;
    provider: ServiceProvider;
    category: ServiceCategory;
    bookings: Booking[];
    get durationHours(): string;
    get formattedPrice(): string;
    get totalBookings(): number;
    get completedBookings(): number;
}
