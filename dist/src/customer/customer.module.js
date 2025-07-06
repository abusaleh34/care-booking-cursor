"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_provider_entity_1 = require("../database/entities/service-provider.entity");
const service_entity_1 = require("../database/entities/service.entity");
const service_category_entity_1 = require("../database/entities/service-category.entity");
const booking_entity_1 = require("../database/entities/booking.entity");
const search_service_1 = require("./services/search.service");
const booking_service_1 = require("./services/booking.service");
const payment_service_1 = require("./services/payment.service");
const auth_module_1 = require("../auth/auth.module");
const cache_module_1 = require("../cache/cache.module");
const websocket_module_1 = require("../websocket/websocket.module");
const customer_controller_1 = require("./controllers/customer.controller");
let CustomerModule = class CustomerModule {
};
exports.CustomerModule = CustomerModule;
exports.CustomerModule = CustomerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([service_provider_entity_1.ServiceProvider, service_entity_1.Service, service_category_entity_1.ServiceCategory, booking_entity_1.Booking]),
            auth_module_1.AuthModule,
            cache_module_1.CacheConfigModule,
            websocket_module_1.WebSocketModule,
        ],
        controllers: [customer_controller_1.CustomerController],
        providers: [search_service_1.SearchService, booking_service_1.BookingService, payment_service_1.PaymentService],
        exports: [search_service_1.SearchService, booking_service_1.BookingService, payment_service_1.PaymentService],
    })
], CustomerModule);
//# sourceMappingURL=customer.module.js.map