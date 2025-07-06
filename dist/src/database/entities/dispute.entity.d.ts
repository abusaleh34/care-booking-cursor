import { Booking } from './booking.entity';
import { User } from './user.entity';
import { AdminUser } from './admin-user.entity';
export declare enum DisputeStatus {
    OPEN = "open",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare class Dispute {
    id: string;
    bookingId: string;
    booking: Booking;
    reporterId: string;
    reporter: User;
    reportedId: string;
    reported: User;
    disputeType: string;
    description: string;
    status: DisputeStatus;
    resolution: string;
    assignedAdminId: string;
    assignedAdmin: AdminUser;
    createdAt: Date;
    resolvedAt: Date;
}
