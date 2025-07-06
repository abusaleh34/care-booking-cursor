import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';
import { Service } from './service.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('bookings')
@Index(['status', 'scheduledDate'])
@Index(['customerId', 'status'])
@Index(['providerId', 'status'])
@Index(['scheduledDate', 'scheduledTime'])
@Index(['createdAt'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'customer_id' })
  @Index()
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column('uuid', { name: 'provider_id' })
  @Index()
  providerId: string;

  @ManyToOne(() => ServiceProvider)
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;

  @Column('uuid', { name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @Index()
  status: BookingStatus;

  @Column({ type: 'date', name: 'scheduled_date' })
  @Index()
  scheduledDate: Date;

  @Column({ type: 'time', name: 'scheduled_time' })
  scheduledTime: string;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  // Alias properties for backward compatibility
  get bookingDate(): Date {
    return this.scheduledDate;
  }

  set bookingDate(value: Date) {
    this.scheduledDate = value;
  }

  get startTime(): string {
    return this.scheduledTime;
  }

  set startTime(value: string) {
    this.scheduledTime = value;
  }

  get endTime(): string {
    if (!this.scheduledTime || !this.duration) return '';
    const [hours, minutes] = this.scheduledTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + this.duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  get totalAmount(): number {
    return this.totalPrice;
  }

  set totalAmount(value: number) {
    this.totalPrice = value;
  }

  get notes(): string {
    return this.customerNotes || '';
  }

  set notes(value: string) {
    this.customerNotes = value;
  }

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'platform_fee' })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'provider_earnings' })
  providerEarnings: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  @Index()
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ type: 'text', nullable: true, name: 'customer_notes' })
  customerNotes: string;

  @Column({ type: 'text', nullable: true, name: 'provider_notes' })
  providerNotes: string;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Check(`"scheduled_date" >= CURRENT_DATE`)
  scheduledDateCheck: any;

  @Check(`"total_price" >= 0`)
  totalPriceCheck: any;

  @Check(`"duration" > 0`)
  durationCheck: any;

  // Relations
  @OneToMany('Review', 'booking')
  reviews: any[];

  // Virtual properties
  get bookingDateTime(): Date {
    const [hours, minutes] = this.scheduledTime.split(':').map(Number);
    const dateTime = new Date(this.scheduledDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  get formattedAmount(): string {
    return `$${this.totalPrice.toFixed(2)}`;
  }
}
