import 'reflect-metadata';
import 'reflect-metadata';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.entity';
import { RefreshToken } from './refresh-token.entity';
import { AuditLog } from './audit-log.entity';
import { MfaSecret } from './mfa-secret.entity';

@Entity('users')
@Index(['isActive', 'isVerified'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'verification_token' })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'verification_token_expires' })
  verificationTokenExpires: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_reset_token' })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_expires' })
  passwordResetExpiry: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'locked_until' })
  lockedUntil: Date;

  @Column({ type: 'boolean', default: false, name: 'mfa_enabled' })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_login_ip' })
  lastLoginIp: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => UserRole, (role) => role.user, { cascade: true })
  roles: UserRole[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @OneToOne(() => MfaSecret, (mfa) => mfa.user)
  mfaSecret: MfaSecret;

  // New Phase 3 relations
  @OneToMany('Review', 'customer')
  customerReviews: any[];

  // Virtual properties
  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get canLogin(): boolean {
    return this.isActive && this.isVerified && !this.isLocked;
  }

  get hasRole(): (role: string) => boolean {
    return (role: string) => {
      return this.roles?.some((userRole) => userRole.roleType === role && userRole.isActive);
    };
  }

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
}
