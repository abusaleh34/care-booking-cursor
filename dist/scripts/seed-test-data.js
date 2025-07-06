"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../src/database/entities/user.entity");
const user_profile_entity_1 = require("../src/database/entities/user-profile.entity");
const user_role_entity_1 = require("../src/database/entities/user-role.entity");
const service_provider_entity_1 = require("../src/database/entities/service-provider.entity");
const service_entity_1 = require("../src/database/entities/service.entity");
const service_category_entity_1 = require("../src/database/entities/service-category.entity");
const admin_user_entity_1 = require("../src/database/entities/admin-user.entity");
const review_entity_1 = require("../src/database/entities/review.entity");
const booking_entity_1 = require("../src/database/entities/booking.entity");
const provider_availability_entity_1 = require("../src/database/entities/provider-availability.entity");
function generateUniquePhone(index) {
    const baseNumber = 2345678900;
    return `+1${baseNumber + index}`;
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    console.log('🌱 Starting comprehensive test data seeding...');
    await clearDatabase(dataSource);
    const admin = await createAdmin(dataSource);
    const categories = await createCategories(dataSource);
    const providers = await createProviders(dataSource, categories);
    const customers = await createCustomers(dataSource);
    await createBookingsAndReviews(dataSource, customers, providers);
    console.log('✅ Test data seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@careservices.test / Admin@123456 / Phone: ' + generateUniquePhone(0));
    console.log('Provider: provider1@test.com / Provider@123 / Phone: ' + generateUniquePhone(1));
    console.log('Customer: customer1@test.com / Customer@123 / Phone: ' + generateUniquePhone(101));
    console.log('\n📱 Phone Number Pattern:');
    console.log('Admin: +12345678900');
    console.log('Providers: +12345678901 to +12345678910');
    console.log('Customers: +12345679001 to +12345679020');
    await app.close();
}
async function clearDatabase(dataSource) {
    console.log('🧹 Clearing existing data...');
    const tables = [
        'reviews',
        'bookings',
        'services',
        'provider_availability',
        'provider_blocked_times',
        'service_providers',
        'admin_users',
        'user_roles',
        'user_profiles',
        'refresh_tokens',
        'audit_logs',
        'mfa_secrets',
        'users',
        'service_categories'
    ];
    for (const table of tables) {
        try {
            await dataSource.query(`TRUNCATE TABLE "${table}" CASCADE`);
            console.log(`  ✓ Cleared table: ${table}`);
        }
        catch (error) {
            console.log(`  ⚠ Skipped table: ${table} (might not exist)`);
        }
    }
}
async function createAdmin(dataSource) {
    console.log('👤 Creating admin user...');
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const userProfileRepo = dataSource.getRepository(user_profile_entity_1.UserProfile);
    const userRoleRepo = dataSource.getRepository(user_role_entity_1.UserRole);
    const adminRepo = dataSource.getRepository(admin_user_entity_1.AdminUser);
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    const user = await userRepo.save({
        email: 'admin@careservices.test',
        passwordHash: hashedPassword,
        phone: generateUniquePhone(0),
        isActive: true,
        isVerified: true
    });
    await userProfileRepo.save({
        userId: user.id,
        firstName: 'Admin',
        lastName: 'User',
        languagePreference: 'en',
        timezone: 'America/New_York'
    });
    await userRoleRepo.save({
        user: { id: user.id },
        roleType: user_role_entity_1.RoleType.ADMIN,
        isActive: true
    });
    const admin = await adminRepo.save({
        userId: user.id,
        adminLevel: admin_user_entity_1.AdminLevel.SUPER_ADMIN,
        permissions: {
            users: ['create', 'read', 'update', 'delete'],
            providers: ['create', 'read', 'update', 'delete', 'verify'],
            bookings: ['read', 'update', 'cancel'],
            payments: ['read', 'refund'],
            settings: ['read', 'update']
        },
        isActive: true
    });
    return admin;
}
async function createCategories(dataSource) {
    console.log('📂 Creating service categories...');
    const categoryRepo = dataSource.getRepository(service_category_entity_1.ServiceCategory);
    const categories = [
        {
            name: 'Beauty & Wellness',
            slug: 'beauty-wellness',
            description: 'Spa, massage, and beauty services',
            icon: 'spa',
            isActive: true
        },
        {
            name: 'Massage Therapy',
            slug: 'massage-therapy',
            description: 'Professional massage and bodywork',
            icon: 'self_improvement',
            isActive: true
        },
        {
            name: 'Hair & Styling',
            slug: 'hair-styling',
            description: 'Haircuts, coloring, and styling',
            icon: 'content_cut',
            isActive: true
        },
        {
            name: 'Fitness & Training',
            slug: 'fitness-training',
            description: 'Personal training and fitness coaching',
            icon: 'fitness_center',
            isActive: true
        },
        {
            name: 'Health & Medical',
            slug: 'health-medical',
            description: 'Healthcare and medical services',
            icon: 'medical_services',
            isActive: true
        },
        {
            name: 'Home Services',
            slug: 'home-services',
            description: 'Cleaning, repairs, and maintenance',
            icon: 'home',
            isActive: true
        }
    ];
    return await categoryRepo.save(categories);
}
async function createProviders(dataSource, categories) {
    console.log('👥 Creating service providers...');
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const userProfileRepo = dataSource.getRepository(user_profile_entity_1.UserProfile);
    const userRoleRepo = dataSource.getRepository(user_role_entity_1.UserRole);
    const providerRepo = dataSource.getRepository(service_provider_entity_1.ServiceProvider);
    const serviceRepo = dataSource.getRepository(service_entity_1.Service);
    const availabilityRepo = dataSource.getRepository(provider_availability_entity_1.ProviderAvailability);
    const providers = [];
    const providerData = [
        {
            email: 'provider1@test.com',
            name: 'Sarah Johnson',
            businessName: 'Serenity Spa & Wellness',
            category: categories[0],
            services: [
                { name: 'Swedish Massage - 60 min', price: 120, duration: 60 },
                { name: 'Deep Tissue Massage - 90 min', price: 150, duration: 90 },
                { name: 'Hot Stone Therapy', price: 180, duration: 90 },
                { name: 'Aromatherapy Session', price: 100, duration: 60 }
            ]
        },
        {
            email: 'provider2@test.com',
            name: 'Michael Chen',
            businessName: 'Elite Fitness Studio',
            category: categories[3],
            services: [
                { name: 'Personal Training Session', price: 80, duration: 60 },
                { name: 'Nutrition Consultation', price: 120, duration: 90 },
                { name: 'Group Fitness Class', price: 40, duration: 60 }
            ]
        },
        {
            email: 'provider3@test.com',
            name: 'Emma Williams',
            businessName: 'Style & Grace Salon',
            category: categories[2],
            services: [
                { name: 'Haircut & Style', price: 75, duration: 60 },
                { name: 'Hair Color & Highlights', price: 150, duration: 120 },
                { name: 'Bridal Hair & Makeup', price: 300, duration: 180 }
            ]
        },
        {
            email: 'provider4@test.com',
            name: 'David Martinez',
            businessName: 'Healing Hands Therapy',
            category: categories[1],
            services: [
                { name: 'Sports Massage', price: 130, duration: 60 },
                { name: 'Prenatal Massage', price: 110, duration: 60 },
                { name: 'Reflexology Treatment', price: 90, duration: 45 }
            ]
        },
        {
            email: 'provider5@test.com',
            name: 'Lisa Thompson',
            businessName: 'Home Clean Pro',
            category: categories[5],
            services: [
                { name: 'Standard House Cleaning', price: 120, duration: 120 },
                { name: 'Deep Cleaning Service', price: 200, duration: 180 },
                { name: 'Move-in/Move-out Cleaning', price: 250, duration: 240 }
            ]
        }
    ];
    for (let i = 0; i < providerData.length; i++) {
        const data = providerData[i];
        const hashedPassword = await bcrypt.hash('Provider@123', 10);
        const user = await userRepo.save({
            email: data.email,
            passwordHash: hashedPassword,
            phone: generateUniquePhone(i + 1),
            isActive: true,
            isVerified: true
        });
        const [firstName, ...lastNameParts] = data.name.split(' ');
        await userProfileRepo.save({
            userId: user.id,
            firstName,
            lastName: lastNameParts.join(' '),
            languagePreference: 'en',
            timezone: 'America/Los_Angeles'
        });
        await userRoleRepo.save({
            user: { id: user.id },
            roleType: user_role_entity_1.RoleType.SERVICE_PROVIDER,
            isActive: true
        });
        const provider = await providerRepo.save({
            userId: user.id,
            businessName: data.businessName,
            businessDescription: `Professional ${data.category.name} services with years of experience`,
            businessAddress: '123 Market Street, San Francisco, CA 94102',
            latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
            yearsOfExperience: Math.floor(Math.random() * 10) + 3,
            licenseNumber: `LIC${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            isActive: true,
            isVerified: true,
            averageRating: 4.5 + Math.random() * 0.5,
            totalRatings: Math.floor(Math.random() * 50) + 10,
            completedServices: Math.floor(Math.random() * 100) + 50,
            businessPhone: generateUniquePhone(1000 + i),
            businessEmail: `${data.businessName.toLowerCase().replace(/\s+/g, '.')}@business.com`
        });
        for (const serviceData of data.services) {
            await serviceRepo.save({
                providerId: provider.id,
                categoryId: data.category.id,
                name: serviceData.name,
                description: `Professional ${serviceData.name} service`,
                price: serviceData.price,
                durationMinutes: serviceData.duration,
                isActive: true
            });
        }
        const daysOfWeek = [1, 2, 3, 4, 5, 6];
        for (const day of daysOfWeek) {
            const startTime = day === 6 ? '10:00:00' : '09:00:00';
            const endTime = day === 6 ? '16:00:00' : '18:00:00';
            await availabilityRepo.save({
                provider_id: provider.id,
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
                is_available: true
            });
        }
        providers.push(provider);
    }
    for (let i = 6; i <= 10; i++) {
        const categoryIndex = Math.floor(Math.random() * categories.length);
        const hashedPassword = await bcrypt.hash('Provider@123', 10);
        const user = await userRepo.save({
            email: `provider${i}@test.com`,
            passwordHash: hashedPassword,
            phone: generateUniquePhone(i),
            isActive: true,
            isVerified: true
        });
        const provider = await providerRepo.save({
            userId: user.id,
            businessName: `Business ${i}`,
            businessDescription: 'Quality services at competitive prices',
            yearsOfExperience: Math.floor(Math.random() * 10) + 1,
            isActive: true,
            isVerified: true,
            averageRating: 3.5 + Math.random() * 1.5,
            totalRatings: Math.floor(Math.random() * 30),
            completedServices: Math.floor(Math.random() * 50),
            latitude: 37.7749 + (Math.random() - 0.5) * 0.2,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.2
        });
        for (const day of [1, 2, 3, 4, 5]) {
            await availabilityRepo.save({
                provider_id: provider.id,
                day_of_week: day,
                start_time: '09:00:00',
                end_time: '17:00:00',
                is_available: true
            });
        }
        providers.push(provider);
    }
    return providers;
}
async function createCustomers(dataSource) {
    console.log('👤 Creating customer accounts...');
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const userProfileRepo = dataSource.getRepository(user_profile_entity_1.UserProfile);
    const userRoleRepo = dataSource.getRepository(user_role_entity_1.UserRole);
    const customers = [];
    const primaryCustomers = [
        { email: 'customer1@test.com', firstName: 'John', lastName: 'Smith' },
        { email: 'customer2@test.com', firstName: 'Jane', lastName: 'Doe' },
        { email: 'customer3@test.com', firstName: 'Robert', lastName: 'Brown' }
    ];
    for (let i = 0; i < primaryCustomers.length; i++) {
        const data = primaryCustomers[i];
        const hashedPassword = await bcrypt.hash('Customer@123', 10);
        const customer = await userRepo.save({
            email: data.email,
            passwordHash: hashedPassword,
            phone: generateUniquePhone(100 + i + 1),
            isActive: true,
            isVerified: true
        });
        await userProfileRepo.save({
            userId: customer.id,
            firstName: data.firstName,
            lastName: data.lastName,
            languagePreference: 'en',
            timezone: 'America/New_York'
        });
        await userRoleRepo.save({
            user: { id: customer.id },
            roleType: user_role_entity_1.RoleType.CUSTOMER,
            isActive: true
        });
        customers.push(customer);
    }
    for (let i = 4; i <= 20; i++) {
        const hashedPassword = await bcrypt.hash('Customer@123', 10);
        const customer = await userRepo.save({
            email: `customer${i}@test.com`,
            passwordHash: hashedPassword,
            phone: generateUniquePhone(100 + i),
            isActive: true,
            isVerified: true
        });
        await userProfileRepo.save({
            userId: customer.id,
            firstName: `Customer`,
            lastName: `${i}`,
            languagePreference: 'en',
            timezone: 'America/New_York'
        });
        await userRoleRepo.save({
            user: { id: customer.id },
            roleType: user_role_entity_1.RoleType.CUSTOMER,
            isActive: true
        });
        customers.push(customer);
    }
    return customers;
}
async function createBookingsAndReviews(dataSource, customers, providers) {
    console.log('📅 Creating bookings and reviews...');
    const bookingRepo = dataSource.getRepository(booking_entity_1.Booking);
    const reviewRepo = dataSource.getRepository(review_entity_1.Review);
    const serviceRepo = dataSource.getRepository(service_entity_1.Service);
    for (let i = 0; i < 30; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const services = await serviceRepo.find({ where: { providerId: provider.id } });
        if (services.length === 0)
            continue;
        const service = services[Math.floor(Math.random() * services.length)];
        const bookingDate = new Date();
        bookingDate.setHours(0, 0, 0, 0);
        const completedDate = new Date(bookingDate);
        completedDate.setHours(16, 0, 0, 0);
        const booking = await bookingRepo.save({
            customerId: customer.id,
            providerId: provider.id,
            serviceId: service.id,
            scheduledDate: bookingDate,
            scheduledTime: '14:00:00',
            duration: service.durationMinutes,
            totalPrice: service.price,
            platformFee: Number(service.price) * 0.1,
            providerEarnings: Number(service.price) * 0.9,
            status: booking_entity_1.BookingStatus.COMPLETED,
            paymentStatus: booking_entity_1.PaymentStatus.PAID,
            paymentIntentId: `pi_test_${Math.random().toString(36).substr(2, 9)}`,
            customerNotes: 'Great service!',
            completedAt: completedDate
        });
        if (Math.random() > 0.3) {
            const rating = Math.floor(Math.random() * 2) + 4;
            await reviewRepo.save({
                booking_id: booking.id,
                customer_id: customer.id,
                provider_id: provider.id,
                rating,
                comment: [
                    'Excellent service! Highly recommended.',
                    'Very professional and friendly.',
                    'Great experience, will book again.',
                    'Outstanding quality and attention to detail.',
                    'Exceeded my expectations!'
                ][Math.floor(Math.random() * 5)],
                is_visible: true
            });
        }
    }
    for (let i = 0; i < 10; i++) {
        const customer = customers[Math.floor(Math.random() * Math.min(5, customers.length))];
        const provider = providers[Math.floor(Math.random() * Math.min(3, providers.length))];
        const services = await serviceRepo.find({ where: { providerId: provider.id } });
        if (services.length === 0)
            continue;
        const service = services[Math.floor(Math.random() * services.length)];
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + Math.floor(Math.random() * 14) + 1);
        await bookingRepo.save({
            customerId: customer.id,
            providerId: provider.id,
            serviceId: service.id,
            scheduledDate: bookingDate,
            scheduledTime: ['09:00:00', '11:00:00', '14:00:00', '16:00:00'][Math.floor(Math.random() * 4)],
            duration: service.durationMinutes,
            totalPrice: service.price,
            platformFee: Number(service.price) * 0.1,
            providerEarnings: Number(service.price) * 0.9,
            status: booking_entity_1.BookingStatus.CONFIRMED,
            paymentStatus: booking_entity_1.PaymentStatus.PENDING,
            paymentIntentId: `pi_test_${Math.random().toString(36).substr(2, 9)}`
        });
    }
    console.log('✅ Created bookings and reviews');
}
bootstrap().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-test-data.js.map