import { User } from './user.entity';
import { Service } from './service.entity';
import { Booking } from './booking.entity';
export declare class ServiceProvider {
    id: string;
    userId: string;
    businessName: string;
    businessDescription: string;
    businessAddress: string;
    latitude: number;
    longitude: number;
    businessPhone: string;
    businessEmail: string;
    licenseNumber: string;
    isVerified: boolean;
    isActive: boolean;
    averageRating: number;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    services: Service[];
    bookings: Booking[];
    availability: any[];
    blockedTimes: any[];
    reviews: any[];
    get location(): {
        lat: number;
        lng: number;
    } | null;
    get activeServicesCount(): number;
    get completedBookingsCount(): number;
}
