"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(RealtimeGateway_1.name);
        this.connectedClients = new Map();
    }
    async handleConnection(client) {
        try {
            const token = this.extractTokenFromSocket(client);
            if (token) {
                const payload = this.jwtService.verify(token);
                client.userId = payload.sub;
                client.userRole = payload.role;
                this.connectedClients.set(client.id, client);
                this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);
                await client.join(`user:${client.userId}`);
                client.emit('connected', {
                    message: 'Connected to real-time updates',
                    userId: client.userId,
                });
            }
            else {
                this.logger.warn(`Client ${client.id} connected without valid token`);
                client.disconnect();
            }
        }
        catch (error) {
            this.logger.error(`Error handling connection for ${client.id}:`, error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id} (User: ${client.userId})`);
    }
    async subscribeToProviderAvailability(data, client) {
        const room = `provider:${data.providerId}:availability:${data.date}`;
        await client.join(room);
        this.logger.debug(`Client ${client.id} subscribed to availability for provider ${data.providerId} on ${data.date}`);
        client.emit('subscription-confirmed', {
            type: 'provider-availability',
            providerId: data.providerId,
            date: data.date,
        });
    }
    async unsubscribeFromProviderAvailability(data, client) {
        const room = `provider:${data.providerId}:availability:${data.date}`;
        await client.leave(room);
        this.logger.debug(`Client ${client.id} unsubscribed from availability for provider ${data.providerId} on ${data.date}`);
    }
    async subscribeToBookingUpdates(data, client) {
        const room = `booking:${data.bookingId}`;
        await client.join(room);
        this.logger.debug(`Client ${client.id} subscribed to booking updates for ${data.bookingId}`);
        client.emit('subscription-confirmed', {
            type: 'booking-updates',
            bookingId: data.bookingId,
        });
    }
    handlePing(client) {
        client.emit('pong', { timestamp: new Date().toISOString() });
    }
    notifyAvailabilityChange(providerId, date, availabilityData) {
        const room = `provider:${providerId}:availability:${date}`;
        this.server.to(room).emit('availability-updated', {
            providerId,
            date,
            availability: availabilityData,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Sent availability update for provider ${providerId} on ${date} to room ${room}`);
    }
    notifyBookingStatusChange(bookingId, status, customerId, providerId) {
        this.server.to(`user:${customerId}`).emit('booking-status-changed', {
            bookingId,
            status,
            timestamp: new Date().toISOString(),
        });
        this.server.to(`user:${providerId}`).emit('booking-status-changed', {
            bookingId,
            status,
            timestamp: new Date().toISOString(),
        });
        this.server.to(`booking:${bookingId}`).emit('booking-status-changed', {
            bookingId,
            status,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Sent booking status update for ${bookingId}: ${status}`);
    }
    notifyNewBooking(booking, providerId) {
        this.server.to(`user:${providerId}`).emit('new-booking', {
            booking,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Sent new booking notification to provider ${providerId}`);
    }
    notifyPaymentConfirmed(bookingId, customerId, providerId, paymentData) {
        this.server.to(`user:${customerId}`).emit('payment-confirmed', {
            bookingId,
            paymentData,
            timestamp: new Date().toISOString(),
        });
        this.server.to(`user:${providerId}`).emit('payment-received', {
            bookingId,
            paymentData,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Sent payment confirmation for booking ${bookingId}`);
    }
    notifyBookingCancelled(bookingId, customerId, providerId, reason) {
        const cancellationData = {
            bookingId,
            reason,
            timestamp: new Date().toISOString(),
        };
        this.server.to(`user:${customerId}`).emit('booking-cancelled', cancellationData);
        this.server.to(`user:${providerId}`).emit('booking-cancelled', cancellationData);
        this.logger.debug(`Sent booking cancellation notification for ${bookingId}`);
    }
    notifyProviderUpdated(providerId, updateData) {
        this.server.emit('provider-updated', {
            providerId,
            updateData,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Sent provider update notification for ${providerId}`);
    }
    broadcastSystemMessage(message, type = 'info') {
        this.server.emit('system-message', {
            message,
            type,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Broadcasted system message: ${message}`);
    }
    extractTokenFromSocket(client) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        const tokenFromQuery = client.handshake.query.token;
        if (typeof tokenFromQuery === 'string') {
            return tokenFromQuery;
        }
        const tokenFromAuth = client.handshake.auth?.token;
        if (typeof tokenFromAuth === 'string') {
            return tokenFromAuth;
        }
        return null;
    }
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
    disconnectUser(userId, reason) {
        for (const [socketId, client] of this.connectedClients.entries()) {
            if (client.userId === userId) {
                client.emit('force-disconnect', { reason: reason || 'Disconnected by system' });
                client.disconnect();
                this.logger.log(`Force disconnected user ${userId} (Socket: ${socketId})`);
            }
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe-provider-availability'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeToProviderAvailability", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe-provider-availability'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "unsubscribeFromProviderAvailability", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe-booking-updates'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeToBookingUpdates", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handlePing", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? ['https://your-frontend-domain.com']
                : ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], RealtimeGateway);
//# sourceMappingURL=websocket.gateway.js.map