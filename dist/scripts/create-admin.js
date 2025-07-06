"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../src/database/entities/user.entity");
const user_profile_entity_1 = require("../src/database/entities/user-profile.entity");
const user_role_entity_1 = require("../src/database/entities/user-role.entity");
const bcrypt = require("bcrypt");
const configService = new config_1.ConfigService();
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST') || 'localhost',
    port: configService.get('DATABASE_PORT') || 5432,
    username: configService.get('DATABASE_USERNAME') || 'ibrahimalmotairi',
    password: configService.get('DATABASE_PASSWORD') || '',
    database: configService.get('DATABASE_NAME') || 'care_services',
    entities: ['src/database/entities/*.entity.ts'],
    synchronize: false,
    logging: true,
});
async function createAdmin() {
    try {
        console.log('🔗 Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected');
        const userRepository = dataSource.getRepository(user_entity_1.User);
        const userProfileRepository = dataSource.getRepository(user_profile_entity_1.UserProfile);
        const userRoleRepository = dataSource.getRepository(user_role_entity_1.UserRole);
        const adminEmail = 'admin@careservices.com';
        const existingAdmin = await userRepository.findOne({
            where: { email: adminEmail }
        });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            return;
        }
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const adminUser = userRepository.create({
            email: adminEmail,
            passwordHash: hashedPassword,
            isVerified: true,
            isActive: true,
        });
        const savedUser = await userRepository.save(adminUser);
        console.log('👤 Created admin user');
        const adminProfile = userProfileRepository.create({
            userId: savedUser.id,
            firstName: 'Admin',
            lastName: 'User',
        });
        await userProfileRepository.save(adminProfile);
        console.log('📝 Created admin profile');
        const adminRole = userRoleRepository.create({
            userId: savedUser.id,
            roleType: user_role_entity_1.RoleType.ADMIN,
            isActive: true,
        });
        await userRoleRepository.save(adminRole);
        console.log('🔑 Created admin role');
        console.log('🎉 Admin user created successfully!');
        console.log('📧 Email: admin@careservices.com');
        console.log('🔒 Password: admin123');
    }
    catch (error) {
        console.error('❌ Failed to create admin:', error);
        process.exit(1);
    }
    finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('📕 Database connection closed');
        }
    }
}
runAdmin();
async function runAdmin() {
    await createAdmin();
}
//# sourceMappingURL=create-admin.js.map