import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from connection handshake
      const token = this.extractTokenFromSocket(client);

      if (token) {
        const payload = this.jwtService.verify(token);
        client.userId = payload.sub;
        client.userRole = payload.role;

        this.connectedClients.set(client.id, client);

        this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);

        // Join user-specific room
        await client.join(`user:${client.userId}`);

        // Send connection confirmation
        client.emit('connected', {
          message: 'Connected to real-time updates',
          userId: client.userId,
        });
      } else {
        this.logger.warn(`Client ${client.id} connected without valid token`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Error handling connection for ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
  }

  // ========== SUBSCRIPTION METHODS ==========

  @SubscribeMessage('subscribe-provider-availability')
  async subscribeToProviderAvailability(
    @MessageBody() data: { providerId: string; date: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const room = `provider:${data.providerId}:availability:${data.date}`;
    await client.join(room);

    this.logger.debug(
      `Client ${client.id} subscribed to availability for provider ${data.providerId} on ${data.date}`,
    );

    client.emit('subscription-confirmed', {
      type: 'provider-availability',
      providerId: data.providerId,
      date: data.date,
    });
  }

  @SubscribeMessage('unsubscribe-provider-availability')
  async unsubscribeFromProviderAvailability(
    @MessageBody() data: { providerId: string; date: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const room = `provider:${data.providerId}:availability:${data.date}`;
    await client.leave(room);

    this.logger.debug(
      `Client ${client.id} unsubscribed from availability for provider ${data.providerId} on ${data.date}`,
    );
  }

  @SubscribeMessage('subscribe-booking-updates')
  async subscribeToBookingUpdates(
    @MessageBody() data: { bookingId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const room = `booking:${data.bookingId}`;
    await client.join(room);

    this.logger.debug(`Client ${client.id} subscribed to booking updates for ${data.bookingId}`);

    client.emit('subscription-confirmed', {
      type: 'booking-updates',
      bookingId: data.bookingId,
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // ========== NOTIFICATION METHODS ==========

  // Notify about availability changes
  notifyAvailabilityChange(providerId: string, date: string, availabilityData: any) {
    const room = `provider:${providerId}:availability:${date}`;

    this.server.to(room).emit('availability-updated', {
      providerId,
      date,
      availability: availabilityData,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(
      `Sent availability update for provider ${providerId} on ${date} to room ${room}`,
    );
  }

  // Notify about booking status changes
  notifyBookingStatusChange(
    bookingId: string,
    status: string,
    customerId: string,
    providerId: string,
  ) {
    // Notify customer
    this.server.to(`user:${customerId}`).emit('booking-status-changed', {
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });

    // Notify provider
    this.server.to(`user:${providerId}`).emit('booking-status-changed', {
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });

    // Notify booking-specific subscribers
    this.server.to(`booking:${bookingId}`).emit('booking-status-changed', {
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Sent booking status update for ${bookingId}: ${status}`);
  }

  // Notify about new bookings
  notifyNewBooking(booking: any, providerId: string) {
    this.server.to(`user:${providerId}`).emit('new-booking', {
      booking,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Sent new booking notification to provider ${providerId}`);
  }

  // Notify about payment confirmations
  notifyPaymentConfirmed(
    bookingId: string,
    customerId: string,
    providerId: string,
    paymentData: any,
  ) {
    // Notify customer
    this.server.to(`user:${customerId}`).emit('payment-confirmed', {
      bookingId,
      paymentData,
      timestamp: new Date().toISOString(),
    });

    // Notify provider
    this.server.to(`user:${providerId}`).emit('payment-received', {
      bookingId,
      paymentData,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Sent payment confirmation for booking ${bookingId}`);
  }

  // Notify about booking cancellations
  notifyBookingCancelled(
    bookingId: string,
    customerId: string,
    providerId: string,
    reason?: string,
  ) {
    const cancellationData = {
      bookingId,
      reason,
      timestamp: new Date().toISOString(),
    };

    // Notify customer
    this.server.to(`user:${customerId}`).emit('booking-cancelled', cancellationData);

    // Notify provider
    this.server.to(`user:${providerId}`).emit('booking-cancelled', cancellationData);

    this.logger.debug(`Sent booking cancellation notification for ${bookingId}`);
  }

  // Notify about service provider updates
  notifyProviderUpdated(providerId: string, updateData: any) {
    // This could notify users who have this provider in their favorites or recent searches
    this.server.emit('provider-updated', {
      providerId,
      updateData,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Sent provider update notification for ${providerId}`);
  }

  // Broadcast system maintenance or announcements
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.server.emit('system-message', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Broadcasted system message: ${message}`);
  }

  // ========== HELPER METHODS ==========

  private extractTokenFromSocket(client: Socket): string | null {
    // Try to get token from different sources
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try from query parameters
    const tokenFromQuery = client.handshake.query.token;
    if (typeof tokenFromQuery === 'string') {
      return tokenFromQuery;
    }

    // Try from auth object (some clients send it this way)
    const tokenFromAuth = client.handshake.auth?.token;
    if (typeof tokenFromAuth === 'string') {
      return tokenFromAuth;
    }

    return null;
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      connectedUsers: Array.from(this.connectedClients.values()).map((client) => ({
        socketId: client.id,
        userId: client.userId,
        userRole: client.userRole,
        connectedAt: client.handshake.issued,
      })),
    };
  }

  // Disconnect specific user
  disconnectUser(userId: string, reason?: string) {
    for (const [socketId, client] of this.connectedClients.entries()) {
      if (client.userId === userId) {
        client.emit('force-disconnect', { reason: reason || 'Disconnected by system' });
        client.disconnect();
        this.logger.log(`Force disconnected user ${userId} (Socket: ${socketId})`);
      }
    }
  }
}
