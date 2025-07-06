"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../src/database/entities/user.entity");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
describe('Authentication (e2e)', () => {
    let app;
    let userRepository;
    let jwtService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }));
        await app.init();
        userRepository = moduleFixture.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
        jwtService = moduleFixture.get(jwt_1.JwtService);
    });
    afterAll(async () => {
        await app.close();
    });
    describe('/auth/register (POST)', () => {
        it('should register a new user successfully', () => {
            const registerDto = {
                email: `test-${Date.now()}@example.com`,
                password: 'Test123!@#',
                fullName: 'Test User',
                phoneNumber: '+1234567890',
            };
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('user');
                expect(res.body).toHaveProperty('tokens');
                expect(res.body.user.email).toBe(registerDto.email);
                expect(res.body.user).not.toHaveProperty('passwordHash');
                expect(res.body.tokens).toHaveProperty('accessToken');
                expect(res.body.tokens).toHaveProperty('refreshToken');
            });
        });
        it('should fail with invalid email', () => {
            const registerDto = {
                email: 'invalid-email',
                password: 'Test123!@#',
                fullName: 'Test User',
            };
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(400)
                .expect((res) => {
                expect(res.body.message).toContain('email');
            });
        });
        it('should fail with weak password', () => {
            const registerDto = {
                email: `test-${Date.now()}@example.com`,
                password: '123456',
                fullName: 'Test User',
            };
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(400)
                .expect((res) => {
                expect(res.body.message).toContain('password');
            });
        });
        it('should fail with duplicate email', async () => {
            const email = `test-${Date.now()}@example.com`;
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'Test123!@#',
                fullName: 'Test User',
            })
                .expect(201);
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'Test123!@#',
                fullName: 'Another User',
            })
                .expect(409)
                .expect((res) => {
                expect(res.body.message).toContain('already exists');
            });
        });
    });
    describe('/auth/login (POST)', () => {
        const testUser = {
            email: `test-login-${Date.now()}@example.com`,
            password: 'Test123!@#',
            fullName: 'Login Test User',
        };
        beforeAll(async () => {
            await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser).expect(201);
        });
        it('should login successfully with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('user');
                expect(res.body).toHaveProperty('tokens');
                expect(res.body.user.email).toBe(testUser.email);
                expect(res.body.tokens).toHaveProperty('accessToken');
                expect(res.body.tokens).toHaveProperty('refreshToken');
            });
        });
        it('should fail with invalid password', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: 'WrongPassword123!',
            })
                .expect(401)
                .expect((res) => {
                expect(res.body.message).toContain('Invalid credentials');
            });
        });
        it('should fail with non-existent email', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'Test123!@#',
            })
                .expect(401)
                .expect((res) => {
                expect(res.body.message).toContain('Invalid credentials');
            });
        });
        it('should fail with missing credentials', () => {
            return request(app.getHttpServer()).post('/api/v1/auth/login').send({}).expect(400);
        });
    });
    describe('/auth/refresh (POST)', () => {
        let refreshToken;
        let accessToken;
        beforeAll(async () => {
            const email = `test-refresh-${Date.now()}@example.com`;
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'Test123!@#',
                fullName: 'Refresh Test User',
            })
                .expect(201);
            const loginResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                email,
                password: 'Test123!@#',
            })
                .expect(200);
            refreshToken = loginResponse.body.tokens.refreshToken;
            accessToken = loginResponse.body.tokens.accessToken;
        });
        it('should refresh tokens successfully', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('tokens');
                expect(res.body.tokens).toHaveProperty('accessToken');
                expect(res.body.tokens).toHaveProperty('refreshToken');
                expect(res.body.tokens.accessToken).not.toBe(accessToken);
            });
        });
        it('should fail with invalid refresh token', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401)
                .expect((res) => {
                expect(res.body.message).toContain('Invalid refresh token');
            });
        });
        it('should fail with missing refresh token', () => {
            return request(app.getHttpServer()).post('/api/v1/auth/refresh').send({}).expect(400);
        });
    });
    describe('/auth/logout (POST)', () => {
        let accessToken;
        let refreshToken;
        beforeAll(async () => {
            const email = `test-logout-${Date.now()}@example.com`;
            const loginResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'Test123!@#',
                fullName: 'Logout Test User',
            })
                .expect(201);
            accessToken = loginResponse.body.tokens.accessToken;
            refreshToken = loginResponse.body.tokens.refreshToken;
        });
        it('should logout successfully', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200)
                .expect((res) => {
                expect(res.body.message).toBe('Logged out successfully');
            });
        });
        it('should fail without authentication', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/logout')
                .send({ refreshToken })
                .expect(401);
        });
        it('should fail to use refresh token after logout', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);
            return request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
                .expect(401);
        });
    });
    describe('/auth/forgot-password (POST)', () => {
        const testEmail = `test-forgot-${Date.now()}@example.com`;
        beforeAll(async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email: testEmail,
                password: 'Test123!@#',
                fullName: 'Forgot Password Test',
            })
                .expect(201);
        });
        it('should send password reset email successfully', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/forgot-password')
                .send({ email: testEmail })
                .expect(200)
                .expect((res) => {
                expect(res.body.message).toContain('Password reset email sent');
            });
        });
        it('should succeed even with non-existent email (security)', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200)
                .expect((res) => {
                expect(res.body.message).toContain('Password reset email sent');
            });
        });
        it('should fail with invalid email format', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);
        });
    });
    describe('Protected Routes', () => {
        let accessToken;
        beforeAll(async () => {
            const email = `test-protected-${Date.now()}@example.com`;
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'Test123!@#',
                fullName: 'Protected Route Test',
            })
                .expect(201);
            accessToken = response.body.tokens.accessToken;
        });
        it('should access protected route with valid token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body).toHaveProperty('email');
            });
        });
        it('should fail to access protected route without token', () => {
            return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
        });
        it('should fail to access protected route with invalid token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
        it('should fail to access protected route with expired token', async () => {
            const expiredToken = jwtService.sign({ sub: (0, uuid_1.v4)(), email: 'test@example.com' }, { expiresIn: '0s' });
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map