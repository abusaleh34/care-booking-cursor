import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ServiceProvider } from '../database/entities/service-provider.entity';
import { Service } from '../database/entities/service.entity';
import { Booking } from '../database/entities/booking.entity';
import { ProviderAvailability } from '../database/entities/provider-availability.entity';
import { ProviderBlockedTimes } from '../database/entities/provider-blocked-times.entity';
import { Review } from '../database/entities/review.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';
import { User } from '../database/entities/user.entity';

// Services
import { ProviderDashboardService } from './services/provider-dashboard.service';
import { ProviderBusinessService } from './services/provider-business.service';
import { ProviderBookingService } from './services/provider-booking.service';
import { ProviderMessagingService } from './services/provider-messaging.service';

// Controllers
import { ProviderController } from './provider.controller';

// Shared modules
import { CacheConfigModule } from '../cache/cache.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceProvider,
      Service,
      Booking,
      ProviderAvailability,
      ProviderBlockedTimes,
      Review,
      Conversation,
      Message,
      User,
    ]),
    CacheConfigModule,
    WebSocketModule,
  ],
  controllers: [ProviderController],
  providers: [
    ProviderDashboardService,
    ProviderBusinessService,
    ProviderBookingService,
    ProviderMessagingService,
  ],
  exports: [
    ProviderDashboardService,
    ProviderBusinessService,
    ProviderBookingService,
    ProviderMessagingService,
  ],
})
export class ProviderModule {}
