import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceProvider } from './service-provider.entity';

@Entity('provider_blocked_times')
@Index(['provider_id', 'blocked_date'])
export class ProviderBlockedTimes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  provider_id: string;

  @Column('date')
  blocked_date: Date;

  @Column('time', { nullable: true })
  start_time: string;

  @Column('time', { nullable: true })
  end_time: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  reason: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_recurring: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => ServiceProvider, (provider) => provider.blockedTimes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;
}
