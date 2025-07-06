import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ServiceProvider } from '../database/entities/service-provider.entity';
import { Service } from '../database/entities/service.entity';
import { ServiceCategory } from '../database/entities/service-category.entity';
import { Booking } from '../database/entities/booking.entity';

// Services
import { SearchService } from './services/search.service';
import { BookingService } from './services/booking.service';
import { PaymentService } from './services/payment.service';
import { AuthModule } from '../auth/auth.module';
import { CacheConfigModule } from '../cache/cache.module';
import { WebSocketModule } from '../websocket/websocket.module';

// Controllers
import { CustomerController } from './controllers/customer.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceProvider, Service, ServiceCategory, Booking]),
    AuthModule, // Import for AuditService dependency
    CacheConfigModule, // Import for Redis caching
    WebSocketModule, // Import for real-time updates
  ],
  controllers: [CustomerController],
  providers: [SearchService, BookingService, PaymentService],
  exports: [SearchService, BookingService, PaymentService],
})
export class CustomerModule {}
