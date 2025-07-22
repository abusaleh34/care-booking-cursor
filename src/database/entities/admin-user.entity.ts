import 'reflect-metadata';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProviderVerification } from './provider-verification.entity';
import { Dispute } from './dispute.entity';
import { PlatformSetting } from './platform-setting.entity';

export enum AdminLevel {
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
  FINANCIAL = 'financial',
}

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AdminLevel,
    name: 'admin_level',
  })
  adminLevel: AdminLevel;

  @Column({
    type: 'jsonb',
    default: {},
  })
  permissions: Record<string, any>;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  isActive: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  // Relations
  @OneToMany(() => ProviderVerification, (verification) => verification.admin)
  verifications: ProviderVerification[];

  @OneToMany(() => Dispute, (dispute) => dispute.assignedAdmin)
  assignedDisputes: Dispute[];

  @OneToMany(() => PlatformSetting, (setting) => setting.updatedBy)
  updatedSettings: PlatformSetting[];
}
