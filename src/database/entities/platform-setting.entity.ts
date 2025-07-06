import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    name: 'setting_key',
  })
  settingKey: string;

  @Column({
    type: 'jsonb',
    name: 'setting_value',
  })
  settingValue: Record<string, any>;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column('uuid', {
    nullable: true,
    name: 'updated_by',
  })
  updatedById: string;

  @ManyToOne(() => AdminUser, (admin) => admin.updatedSettings)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: AdminUser;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;
}
