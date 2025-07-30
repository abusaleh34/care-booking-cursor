import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserRole } from './entities/user-role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { MfaSecret } from './entities/mfa-secret.entity';
import { ServiceProvider } from './entities/service-provider.entity';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { Booking } from './entities/booking.entity';
import { ProviderAvailability } from './entities/provider-availability.entity';
import { ProviderBlockedTimes } from './entities/provider-blocked-times.entity';
import { Review } from './entities/review.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { AdminUser } from './entities/admin-user.entity';
import { ProviderVerification } from './entities/provider-verification.entity';
import { Dispute } from './entities/dispute.entity';
import { PlatformSetting } from './entities/platform-setting.entity';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST') || 'localhost',
  port: configService.get('DATABASE_PORT') || 5432,
  username:
    configService.get('DATABASE_USER') || configService.get('DATABASE_USERNAME') || 'postgres',
  password: configService.get('DATABASE_PASSWORD') || 'postgres123',
  database: configService.get('DATABASE_NAME') || 'care_services_db',
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  entities: [
    User,
    UserProfile,
    UserRole,
    RefreshToken,
    AuditLog,
    MfaSecret,
    ServiceProvider,
    Service,
    ServiceCategory,
    Booking,
    ProviderAvailability,
    ProviderBlockedTimes,
    Review,
    Conversation,
    Message,
    AdminUser,
    ProviderVerification,
    Dispute,
    PlatformSetting,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
});

// Export both named and default for compatibility
export { AppDataSource };
export default AppDataSource;
