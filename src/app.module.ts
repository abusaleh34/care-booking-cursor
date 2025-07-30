import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';

import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { ProviderModule } from './provider/provider.module';
import { AdminModule } from './admin/admin.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { MockAuthController } from './controllers/mock-auth.controller';
import { winstonConfig } from './common/logger/winston.config';

// Database entities
import { User } from './database/entities/user.entity';
import { UserProfile } from './database/entities/user-profile.entity';
import { UserRole } from './database/entities/user-role.entity';
import { RefreshToken } from './database/entities/refresh-token.entity';
import { AuditLog } from './database/entities/audit-log.entity';
import { MfaSecret } from './database/entities/mfa-secret.entity';
import { ServiceProvider } from './database/entities/service-provider.entity';
import { Service } from './database/entities/service.entity';
import { ServiceCategory } from './database/entities/service-category.entity';
import { Booking } from './database/entities/booking.entity';
import { ProviderAvailability } from './database/entities/provider-availability.entity';
import { ProviderBlockedTimes } from './database/entities/provider-blocked-times.entity';
import { Review } from './database/entities/review.entity';
import { Conversation } from './database/entities/conversation.entity';
import { Message } from './database/entities/message.entity';
// Phase 4 Administrative entities
import { AdminUser } from './database/entities/admin-user.entity';
import { ProviderVerification } from './database/entities/provider-verification.entity';
import { Dispute } from './database/entities/dispute.entity';
import { PlatformSetting } from './database/entities/platform-setting.entity';

// Modules
import { CommonModule } from './common/common.module';
import { CacheConfigModule } from './cache/cache.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WinstonModule.forRoot(winstonConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST') || 'localhost',
        port: configService.get('DATABASE_PORT') || 5432,
        username:
          configService.get('DATABASE_USER') ||
          configService.get('DATABASE_USERNAME') ||
          'postgres',
        password: configService.get('DATABASE_PASSWORD') || 'postgres123',
        database: configService.get('DATABASE_NAME') || 'care_services_db',
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
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60000,
          limit: configService.get('THROTTLE_LIMIT') || 10,
        },
      ],
      inject: [ConfigService],
    }),
    CommonModule,
    CacheConfigModule,
    WebSocketModule,
    AuthModule,
    CustomerModule,
    ProviderModule,
    AdminModule,
  ],
  controllers: [AppController, MockAuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
