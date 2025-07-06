"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../database/entities/user.entity");
const user_profile_entity_1 = require("../database/entities/user-profile.entity");
const user_role_entity_1 = require("../database/entities/user-role.entity");
const refresh_token_entity_1 = require("../database/entities/refresh-token.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const mfa_secret_entity_1 = require("../database/entities/mfa-secret.entity");
const auth_service_1 = require("./services/auth.service");
const token_service_1 = require("./services/token.service");
const email_service_1 = require("./services/email.service");
const sms_service_1 = require("./services/sms.service");
const audit_service_1 = require("./services/audit.service");
const password_service_1 = require("./services/password.service");
const auth_controller_1 = require("./controllers/auth.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, user_profile_entity_1.UserProfile, user_role_entity_1.UserRole, refresh_token_entity_1.RefreshToken, audit_log_entity_1.AuditLog, mfa_secret_entity_1.MfaSecret]),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            email_service_1.EmailService,
            sms_service_1.SmsService,
            audit_service_1.AuditService,
            password_service_1.PasswordService,
            jwt_strategy_1.JwtStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
        ],
        exports: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            email_service_1.EmailService,
            sms_service_1.SmsService,
            audit_service_1.AuditService,
            password_service_1.PasswordService,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map