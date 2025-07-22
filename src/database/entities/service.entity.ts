import 'reflect-metadata';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceProvider } from './service-provider.entity';
import { ServiceCategory } from './service-category.entity';
import { Booking } from './booking.entity';

@Entity('services')
@Index(['isActive'])
@Index(['price'])
@Index(['durationMinutes'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: true, name: 'is_home_service' })
  isHomeService: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => ServiceProvider, (provider) => provider.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;

  @ManyToOne(() => ServiceCategory, (category) => category.services)
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  // Virtual properties
  get durationHours(): string {
    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;

    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  }

  get formattedPrice(): string {
    return `$${this.price.toFixed(2)}`;
  }

  get totalBookings(): number {
    return this.bookings?.length || 0;
  }

  get completedBookings(): number {
    return this.bookings?.filter((booking) => booking.status === 'completed').length || 0;
  }
}
