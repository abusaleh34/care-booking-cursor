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

@Entity('provider_availability')
@Index(['provider_id', 'day_of_week'])
export class ProviderAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  provider_id: string;

  @Column({
    type: 'integer',
    comment: '0=Sunday, 1=Monday, ..., 6=Saturday',
  })
  day_of_week: number;

  @Column('time')
  start_time: string;

  @Column('time')
  end_time: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => ServiceProvider, (provider) => provider.availability, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;
}
