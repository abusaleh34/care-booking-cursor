"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const nest_winston_1 = require("nest-winston");
const auth_module_1 = require("./auth/auth.module");
const customer_module_1 = require("./customer/customer.module");
const provider_module_1 = require("./provider/provider.module");
const admin_module_1 = require("./admin/admin.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const app_controller_1 = require("./app.controller");
const mock_auth_controller_1 = require("./controllers/mock-auth.controller");
const winston_config_1 = require("./common/logger/winston.config");
const user_entity_1 = require("./database/entities/user.entity");
const user_profile_entity_1 = require("./database/entities/user-profile.entity");
const user_role_entity_1 = require("./database/entities/user-role.entity");
const refresh_token_entity_1 = require("./database/entities/refresh-token.entity");
const audit_log_entity_1 = require("./database/entities/audit-log.entity");
const mfa_secret_entity_1 = require("./database/entities/mfa-secret.entity");
const service_provider_entity_1 = require("./database/entities/service-provider.entity");
const service_entity_1 = require("./database/entities/service.entity");
const service_category_entity_1 = require("./database/entities/service-category.entity");
const booking_entity_1 = require("./database/entities/booking.entity");
const provider_availability_entity_1 = require("./database/entities/provider-availability.entity");
const provider_blocked_times_entity_1 = require("./database/entities/provider-blocked-times.entity");
const review_entity_1 = require("./database/entities/review.entity");
const conversation_entity_1 = require("./database/entities/conversation.entity");
const message_entity_1 = require("./database/entities/message.entity");
const admin_user_entity_1 = require("./database/entities/admin-user.entity");
const provider_verification_entity_1 = require("./database/entities/provider-verification.entity");
const dispute_entity_1 = require("./database/entities/dispute.entity");
const platform_setting_entity_1 = require("./database/entities/platform-setting.entity");
const common_module_1 = require("./common/common.module");
const cache_module_1 = require("./cache/cache.module");
const websocket_module_1 = require("./websocket/websocket.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            nest_winston_1.WinstonModule.forRoot(winston_config_1.winstonConfig),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DATABASE_HOST') || 'localhost',
                    port: configService.get('DATABASE_PORT') || 5432,
                    username: configService.get('DATABASE_USER') || configService.get('DATABASE_USERNAME') || 'postgres',
                    password: configService.get('DATABASE_PASSWORD') || 'postgres123',
                    database: configService.get('DATABASE_NAME') || 'care_services_db',
                    entities: [
                        user_entity_1.User,
                        user_profile_entity_1.UserProfile,
                        user_role_entity_1.UserRole,
                        refresh_token_entity_1.RefreshToken,
                        audit_log_entity_1.AuditLog,
                        mfa_secret_entity_1.MfaSecret,
                        service_provider_entity_1.ServiceProvider,
                        service_entity_1.Service,
                        service_category_entity_1.ServiceCategory,
                        booking_entity_1.Booking,
                        provider_availability_entity_1.ProviderAvailability,
                        provider_blocked_times_entity_1.ProviderBlockedTimes,
                        review_entity_1.Review,
                        conversation_entity_1.Conversation,
                        message_entity_1.Message,
                        admin_user_entity_1.AdminUser,
                        provider_verification_entity_1.ProviderVerification,
                        dispute_entity_1.Dispute,
                        platform_setting_entity_1.PlatformSetting,
                    ],
                    synchronize: configService.get('NODE_ENV') === 'development',
                    logging: configService.get('NODE_ENV') === 'development',
                    autoLoadEntities: true,
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => [
                    {
                        ttl: configService.get('THROTTLE_TTL') || 60000,
                        limit: configService.get('THROTTLE_LIMIT') || 10,
                    },
                ],
                inject: [config_1.ConfigService],
            }),
            common_module_1.CommonModule,
            cache_module_1.CacheConfigModule,
            websocket_module_1.WebSocketModule,
            auth_module_1.AuthModule,
            customer_module_1.CustomerModule,
            provider_module_1.ProviderModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController, mock_auth_controller_1.MockAuthController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map