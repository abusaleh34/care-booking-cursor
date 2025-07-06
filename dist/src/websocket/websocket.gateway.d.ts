import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    subscribeToProviderAvailability(data: {
        providerId: string;
        date: string;
    }, client: AuthenticatedSocket): Promise<void>;
    unsubscribeFromProviderAvailability(data: {
        providerId: string;
        date: string;
    }, client: AuthenticatedSocket): Promise<void>;
    subscribeToBookingUpdates(data: {
        bookingId: string;
    }, client: AuthenticatedSocket): Promise<void>;
    handlePing(client: AuthenticatedSocket): void;
    notifyAvailabilityChange(providerId: string, date: string, availabilityData: any): void;
    notifyBookingStatusChange(bookingId: string, status: string, customerId: string, providerId: string): void;
    notifyNewBooking(booking: any, providerId: string): void;
    notifyPaymentConfirmed(bookingId: string, customerId: string, providerId: string, paymentData: any): void;
    notifyBookingCancelled(bookingId: string, customerId: string, providerId: string, reason?: string): void;
    notifyProviderUpdated(providerId: string, updateData: any): void;
    broadcastSystemMessage(message: string, type?: 'info' | 'warning' | 'error'): void;
    private extractTokenFromSocket;
    getConnectionStats(): {
        totalConnections: number;
        connectedUsers: {
            socketId: string;
            userId: string;
            userRole: string;
            connectedAt: number;
        }[];
    };
    disconnectUser(userId: string, reason?: string): void;
}
export {};
