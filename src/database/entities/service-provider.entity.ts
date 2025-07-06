import {
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
import { Service } from './service.entity';
import { Booking } from './booking.entity';

@Entity('service_providers')
@Index(['isActive'])
@Index(['isVerified'])
@Index(['averageRating'])
@Index(['latitude', 'longitude'])
export class ServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 200, name: 'business_name' })
  businessName: string;

  @Column({ type: 'text', nullable: true, name: 'business_description' })
  businessDescription: string;

  @Column({ type: 'text', nullable: true, name: 'business_address' })
  businessAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'business_phone' })
  businessPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'business_email' })
  businessEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'license_number' })
  licenseNumber: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number;

  @Column({ type: 'integer', default: 0, name: 'total_reviews' })
  totalReviews: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Service, (service) => service.provider)
  services: Service[];

  @OneToMany(() => Booking, (booking) => booking.provider)
  bookings: Booking[];

  // New Phase 3 relations
  @OneToMany('ProviderAvailability', 'provider')
  availability: any[];

  @OneToMany('ProviderBlockedTimes', 'provider')
  blockedTimes: any[];

  @OneToMany('Review', 'provider')
  reviews: any[];

  // Virtual properties
  get location(): { lat: number; lng: number } | null {
    return this.latitude && this.longitude ? { lat: this.latitude, lng: this.longitude } : null;
  }

  get activeServicesCount(): number {
    return this.services?.filter((service) => service.isActive).length || 0;
  }

  get completedBookingsCount(): number {
    return this.bookings?.filter((booking) => booking.status === 'completed').length || 0;
  }
}
