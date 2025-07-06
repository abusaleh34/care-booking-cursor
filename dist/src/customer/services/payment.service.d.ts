import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { PaymentDto } from '../dto/create-booking.dto';
import { AuditService } from '../../auth/services/audit.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
export interface PaymentResult {
    success: boolean;
    paymentIntentId?: string;
    clientSecret?: string;
    amount: number;
    platformCommission: number;
    providerAmount: number;
    receiptUrl?: string;
    booking: {
        id: string;
        status: BookingStatus;
        totalAmount: number;
    };
}
export interface RefundResult {
    success: boolean;
    refundId: string;
    amount: number;
    status: string;
    booking: {
        id: string;
        status: BookingStatus;
    };
}
export declare class PaymentService {
    private readonly bookingRepository;
    private readonly configService;
    private readonly auditService;
    private readonly realtimeGateway;
    private readonly logger;
    private readonly stripe;
    private readonly commissionRate;
    constructor(bookingRepository: Repository<Booking>, configService: ConfigService, auditService: AuditService, realtimeGateway: RealtimeGateway);
    processPayment(customerId: string, paymentDto: PaymentDto, ipAddress: string, userAgent: string): Promise<PaymentResult>;
    confirmPayment(customerId: string, paymentIntentId: string, ipAddress: string, userAgent: string): Promise<PaymentResult>;
    processRefund(bookingId: string, customerId: string, reason: string, ipAddress: string, userAgent: string): Promise<RefundResult>;
    handleWebhook(signature: string, payload: Buffer): Promise<void>;
    private calculateCommission;
    private calculateRefundAmount;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handleRefundCreated;
    private sendPaymentConfirmationEmails;
}
