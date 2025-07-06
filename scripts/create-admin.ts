import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../src/database/entities/user.entity';
import { UserProfile } from '../src/database/entities/user-profile.entity';
import { UserRole, RoleType } from '../src/database/entities/user-role.entity';
import * as bcrypt from 'bcrypt';

const configService = new ConfigService();

const dataSource = new DataSource({
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

    const userRepository = dataSource.getRepository(User);
    const userProfileRepository = dataSource.getRepository(UserProfile);
    const userRoleRepository = dataSource.getRepository(UserRole);

    const adminEmail = 'admin@careservices.com';
    
    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = userRepository.create({
      email: adminEmail,
      passwordHash: hashedPassword,
      isVerified: true,
      isActive: true,
    });
    const savedUser = await userRepository.save(adminUser);
    console.log('👤 Created admin user');

    // Create admin profile
    const adminProfile = userProfileRepository.create({
      userId: savedUser.id,
      firstName: 'Admin',
      lastName: 'User',
    });
    await userProfileRepository.save(adminProfile);
    console.log('📝 Created admin profile');

    // Create admin role
    const adminRole = userRoleRepository.create({
      userId: savedUser.id,
      roleType: RoleType.ADMIN,
      isActive: true,
    });
    await userRoleRepository.save(adminRole);
    console.log('🔑 Created admin role');

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@careservices.com');
    console.log('🔒 Password: admin123');

  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  } finally {
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