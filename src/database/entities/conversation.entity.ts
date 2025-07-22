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
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { ServiceProvider } from './service-provider.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['customer_id', 'provider_id'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  booking_id: string;

  @Column('uuid')
  customer_id: string;

  @Column('uuid')
  provider_id: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => ServiceProvider)
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
