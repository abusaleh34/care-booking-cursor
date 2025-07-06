"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAuthController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let MockAuthController = class MockAuthController {
    constructor() {
        this.users = [];
    }
    async register(registerDto, res) {
        try {
            const { email, password, firstName, lastName, phone } = registerDto;
            if (!email || !password || !firstName || !lastName) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    statusCode: 400,
                    message: 'Missing required fields: email, password, firstName, lastName',
                });
            }
            const existingUser = this.users.find((user) => user.email === email);
            if (existingUser) {
                return res.status(common_1.HttpStatus.CONFLICT).json({
                    statusCode: 409,
                    message: 'User with this email already exists',
                });
            }
            const newUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email,
                firstName,
                lastName,
                phone: phone || null,
                isVerified: true,
                mfaEnabled: false,
                createdAt: new Date().toISOString(),
            };
            this.users.push(newUser);
            const accessToken = `mock_access_token_${newUser.id}_${Date.now()}`;
            const refreshToken = `mock_refresh_token_${newUser.id}_${Date.now()}`;
            return res.status(common_1.HttpStatus.CREATED).json({
                statusCode: 201,
                message: 'User registered successfully',
                accessToken,
                refreshToken,
                expiresIn: 86400,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    isVerified: newUser.isVerified,
                    mfaEnabled: newUser.mfaEnabled,
                    profile: {
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        avatarUrl: null,
                    },
                    roles: ['customer'],
                },
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: 500,
                message: 'Registration failed',
                error: error.message,
            });
        }
    }
    async login(loginDto, res) {
        try {
            const { email, password } = loginDto;
            if (!email || !password) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                    statusCode: 400,
                    message: 'Email and password are required',
                });
            }
            const user = this.users.find((u) => u.email === email);
            if (!user) {
                return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                    statusCode: 401,
                    message: 'Invalid credentials',
                });
            }
            const accessToken = `mock_access_token_${user.id}_${Date.now()}`;
            const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;
            return res.status(common_1.HttpStatus.OK).json({
                statusCode: 200,
                message: 'Login successful',
                accessToken,
                refreshToken,
                expiresIn: 86400,
                user: {
                    id: user.id,
                    email: user.email,
                    isVerified: user.isVerified,
                    mfaEnabled: user.mfaEnabled,
                    profile: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        avatarUrl: null,
                    },
                    roles: ['customer'],
                },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: 500,
                message: 'Login failed',
                error: error.message,
            });
        }
    }
    async demoReset(res) {
        this.users = [];
        return res.status(common_1.HttpStatus.OK).json({
            statusCode: 200,
            message: 'Demo data reset successfully',
            usersCount: 0,
        });
    }
};
exports.MockAuthController = MockAuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MockAuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MockAuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('demo-reset'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MockAuthController.prototype, "demoReset", null);
exports.MockAuthController = MockAuthController = __decorate([
    (0, common_1.Controller)('api/v1/auth')
], MockAuthController);
//# sourceMappingURL=mock-auth.controller.js.map