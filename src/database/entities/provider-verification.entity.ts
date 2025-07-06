import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceProvider } from './service-provider.entity';
import { AdminUser } from './admin-user.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_INFO = 'requires_info',
}

@Entity('provider_verifications')
export class ProviderVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => ServiceProvider)
  @JoinColumn({ name: 'provider_id' })
  provider: ServiceProvider;

  @Column('uuid', { name: 'admin_id' })
  adminId: string;

  @ManyToOne(() => AdminUser, (admin) => admin.verifications)
  @JoinColumn({ name: 'admin_id' })
  admin: AdminUser;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'verification_type',
  })
  verificationType: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column({
    type: 'jsonb',
    default: [],
  })
  documents: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
  }>;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'reviewed_at',
  })
  reviewedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;
}
