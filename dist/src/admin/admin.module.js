"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const websocket_module_1 = require("../websocket/websocket.module");
const common_module_1 = require("../common/common.module");
const admin_controller_1 = require("./admin.controller");
const admin_dashboard_service_1 = require("./services/admin-dashboard.service");
const admin_user_management_service_1 = require("./services/admin-user-management.service");
const user_entity_1 = require("../database/entities/user.entity");
const user_role_entity_1 = require("../database/entities/user-role.entity");
const user_profile_entity_1 = require("../database/entities/user-profile.entity");
const service_provider_entity_1 = require("../database/entities/service-provider.entity");
const service_category_entity_1 = require("../database/entities/service-category.entity");
const service_entity_1 = require("../database/entities/service.entity");
const booking_entity_1 = require("../database/entities/booking.entity");
const review_entity_1 = require("../database/entities/review.entity");
const admin_user_entity_1 = require("../database/entities/admin-user.entity");
const provider_verification_entity_1 = require("../database/entities/provider-verification.entity");
const dispute_entity_1 = require("../database/entities/dispute.entity");
const platform_setting_entity_1 = require("../database/entities/platform-setting.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                user_role_entity_1.UserRole,
                user_profile_entity_1.UserProfile,
                service_provider_entity_1.ServiceProvider,
                service_category_entity_1.ServiceCategory,
                service_entity_1.Service,
                booking_entity_1.Booking,
                review_entity_1.Review,
                admin_user_entity_1.AdminUser,
                provider_verification_entity_1.ProviderVerification,
                dispute_entity_1.Dispute,
                platform_setting_entity_1.PlatformSetting,
            ]),
            auth_module_1.AuthModule,
            websocket_module_1.WebSocketModule,
            common_module_1.CommonModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [
            admin_dashboard_service_1.AdminDashboardService,
            admin_user_management_service_1.AdminUserManagementService,
        ],
        exports: [admin_dashboard_service_1.AdminDashboardService, admin_user_management_service_1.AdminUserManagementService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map