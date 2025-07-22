import 'reflect-metadata';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { AdminUser } from './admin-user.entity';

export enum DisputeStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column('uuid', { name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column('uuid', { name: 'reported_id' })
  reportedId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_id' })
  reported: User;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'dispute_type',
  })
  disputeType: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  resolution: string;

  @Column('uuid', {
    nullable: true,
    name: 'assigned_admin_id',
  })
  assignedAdminId: string;

  @ManyToOne(() => AdminUser, (admin) => admin.assignedDisputes)
  @JoinColumn({ name: 'assigned_admin_id' })
  assignedAdmin: AdminUser;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'resolved_at',
  })
  resolvedAt: Date;
}
