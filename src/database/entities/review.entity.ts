import 'reflect-metadata';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';

@Entity('reviews')
@Index(['provider_id', 'is_visible'])
@Index(['booking_id'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  booking_id: string;

  @Column('uuid')
  customer_id: string;

  @Column('uuid')
  provider_id: string;

  @Column({
    type: 'integer',
    comment: 'Rating from 1 to 5',
  })
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @Column({
    type: 'jsonb',
    default: '[]',
    comment: 'Array of image URLs',
  })
  images: string[];

  @Column({
    type: 'boolean',
    default: true,
  })
  is_visible: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Booking, (booking) => booking.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => User, (user) => user.customerReviews)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => ServiceProvider, (provider) => provider.reviews)
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;
}
