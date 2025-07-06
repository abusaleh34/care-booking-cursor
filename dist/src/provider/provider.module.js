"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_provider_entity_1 = require("../database/entities/service-provider.entity");
const service_entity_1 = require("../database/entities/service.entity");
const booking_entity_1 = require("../database/entities/booking.entity");
const provider_availability_entity_1 = require("../database/entities/provider-availability.entity");
const provider_blocked_times_entity_1 = require("../database/entities/provider-blocked-times.entity");
const review_entity_1 = require("../database/entities/review.entity");
const conversation_entity_1 = require("../database/entities/conversation.entity");
const message_entity_1 = require("../database/entities/message.entity");
const user_entity_1 = require("../database/entities/user.entity");
const provider_dashboard_service_1 = require("./services/provider-dashboard.service");
const provider_business_service_1 = require("./services/provider-business.service");
const provider_booking_service_1 = require("./services/provider-booking.service");
const provider_messaging_service_1 = require("./services/provider-messaging.service");
const provider_controller_1 = require("./provider.controller");
const cache_module_1 = require("../cache/cache.module");
const websocket_module_1 = require("../websocket/websocket.module");
let ProviderModule = class ProviderModule {
};
exports.ProviderModule = ProviderModule;
exports.ProviderModule = ProviderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                service_provider_entity_1.ServiceProvider,
                service_entity_1.Service,
                booking_entity_1.Booking,
                provider_availability_entity_1.ProviderAvailability,
                provider_blocked_times_entity_1.ProviderBlockedTimes,
                review_entity_1.Review,
                conversation_entity_1.Conversation,
                message_entity_1.Message,
                user_entity_1.User,
            ]),
            cache_module_1.CacheConfigModule,
            websocket_module_1.WebSocketModule,
        ],
        controllers: [provider_controller_1.ProviderController],
        providers: [
            provider_dashboard_service_1.ProviderDashboardService,
            provider_business_service_1.ProviderBusinessService,
            provider_booking_service_1.ProviderBookingService,
            provider_messaging_service_1.ProviderMessagingService,
        ],
        exports: [
            provider_dashboard_service_1.ProviderDashboardService,
            provider_business_service_1.ProviderBusinessService,
            provider_booking_service_1.ProviderBookingService,
            provider_messaging_service_1.ProviderMessagingService,
        ],
    })
], ProviderModule);
//# sourceMappingURL=provider.module.js.map