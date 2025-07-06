"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./entities/user.entity");
const user_profile_entity_1 = require("./entities/user-profile.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const mfa_secret_entity_1 = require("./entities/mfa-secret.entity");
const service_provider_entity_1 = require("./entities/service-provider.entity");
const service_entity_1 = require("./entities/service.entity");
const service_category_entity_1 = require("./entities/service-category.entity");
const booking_entity_1 = require("./entities/booking.entity");
const provider_availability_entity_1 = require("./entities/provider-availability.entity");
const provider_blocked_times_entity_1 = require("./entities/provider-blocked-times.entity");
const review_entity_1 = require("./entities/review.entity");
const conversation_entity_1 = require("./entities/conversation.entity");
const message_entity_1 = require("./entities/message.entity");
const admin_user_entity_1 = require("./entities/admin-user.entity");
const provider_verification_entity_1 = require("./entities/provider-verification.entity");
const dispute_entity_1 = require("./entities/dispute.entity");
const platform_setting_entity_1 = require("./entities/platform-setting.entity");
const configService = new config_1.ConfigService();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST') || 'localhost',
    port: configService.get('DATABASE_PORT') || 5432,
    username: configService.get('DATABASE_USER') || configService.get('DATABASE_USERNAME') || 'postgres',
    password: configService.get('DATABASE_PASSWORD') || 'postgres123',
    database: configService.get('DATABASE_NAME') || 'care_services_db',
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
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
    migrations: ['src/database/migrations/*.ts'],
    subscribers: ['src/database/subscribers/*.ts'],
});
exports.AppDataSource = AppDataSource;
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map