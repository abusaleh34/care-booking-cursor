import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/database/entities/user.entity';
import { ServiceProvider } from '../src/database/entities/service-provider.entity';
import { Service } from '../src/database/entities/service.entity';
import { ServiceCategory } from '../src/database/entities/service-category.entity';
import { AdminUser, AdminLevel } from '../src/database/entities/admin-user.entity';
import { Review } from '../src/database/entities/review.entity';
import { Booking, BookingStatus, PaymentStatus } from '../src/database/entities/booking.entity';
import { ProviderAvailability } from '../src/database/entities/provider-availability.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('🌱 Starting comprehensive test data seeding...');

  // Clear existing data
  await clearDatabase(dataSource);

  // Create test data
  const admin = await createAdmin(dataSource);
  const categories = await createCategories(dataSource);
  const providers = await createProviders(dataSource, categories);
  const customers = await createCustomers(dataSource);
  await createBookingsAndReviews(dataSource, customers, providers);

  console.log('✅ Test data seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin: admin@careservices.test / Admin@123456');
  console.log('Provider: provider1@test.com / Provider@123');
  console.log('Customer: customer1@test.com / Customer@123');
  
  await app.close();
}

async function clearDatabase(dataSource: DataSource) {
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
    } catch (error) {
      // Table might not exist yet
    }
  }
}

async function createAdmin(dataSource: DataSource) {
  console.log('👤 Creating admin user...');
  
  const userRepo = dataSource.getRepository(User);
  const adminRepo = dataSource.getRepository(AdminUser);
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  
  // Create user first
  const user = await userRepo.save({
    email: 'admin@careservices.test',
    passwordHash: hashedPassword,
    phone: '+1234567890',
    isActive: true,
    isVerified: true
  });
  
  // Create admin profile
  const admin = await adminRepo.save({
    userId: user.id,
    adminLevel: AdminLevel.SUPER_ADMIN,
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

async function createCategories(dataSource: DataSource) {
  console.log('📂 Creating service categories...');
  
  const categoryRepo = dataSource.getRepository(ServiceCategory);
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

async function createProviders(dataSource: DataSource, categories: ServiceCategory[]) {
  console.log('👥 Creating service providers...');
  
  const userRepo = dataSource.getRepository(User);
  const providerRepo = dataSource.getRepository(ServiceProvider);
  const serviceRepo = dataSource.getRepository(Service);
  const availabilityRepo = dataSource.getRepository(ProviderAvailability);
  
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
  
  for (const data of providerData) {
    // Create user
    const hashedPassword = await bcrypt.hash('Provider@123', 10);
    const user = await userRepo.save({
      email: data.email,
      passwordHash: hashedPassword,
      phone: '+1234567890',
      isActive: true,
      isVerified: true
    });
    
    // Create provider profile
    const provider = await providerRepo.save({
      userId: user.id,
      businessName: data.businessName,
      businessDescription: `Professional ${data.category.name} services with years of experience`,
      businessAddress: '123 Market Street, San Francisco, CA 94102',
      latitude: -122.4194 + (Math.random() - 0.5) * 0.1,
      longitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      yearsOfExperience: Math.floor(Math.random() * 10) + 3,
      licenseNumber: `LIC${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      isActive: true,
      isVerified: true,
      averageRating: 4.5 + Math.random() * 0.5,
      totalRatings: Math.floor(Math.random() * 50) + 10,
      completedServices: Math.floor(Math.random() * 100) + 50
    });
    
    // Create services
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
    
    // Create availability (Mon-Fri 9AM-6PM, Sat 10AM-4PM)
    const daysOfWeek = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
    for (const day of daysOfWeek) {
      const startTime = day === 6 ? '10:00:00' : '09:00:00';
      const endTime = day === 6 ? '16:00:00' : '18:00:00';
      
      await availabilityRepo.save({
        provider_id: provider.id,  // snake_case as per entity definition
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        is_available: true
      });
    }
    
    providers.push(provider);
  }
  
  // Create 5 more providers for variety
  for (let i = 6; i <= 10; i++) {
    const categoryIndex = Math.floor(Math.random() * categories.length);
    const hashedPassword = await bcrypt.hash('Provider@123', 10);
    
    const user = await userRepo.save({
      email: `provider${i}@test.com`,
      passwordHash: hashedPassword,
      phone: '+1234567890',
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
      latitude: -122.4194 + (Math.random() - 0.5) * 0.2,
      longitude: 37.7749 + (Math.random() - 0.5) * 0.2
    });
    
    providers.push(provider);
  }
  
  return providers;
}

async function createCustomers(dataSource: DataSource) {
  console.log('👤 Creating customer accounts...');
  
  const userRepo = dataSource.getRepository(User);
  const customers = [];
  
  // Create primary test customers
  const primaryCustomers = [
    { email: 'customer1@test.com', name: 'John Smith' },
    { email: 'customer2@test.com', name: 'Jane Doe' },
    { email: 'customer3@test.com', name: 'Robert Brown' }
  ];
  
  for (const data of primaryCustomers) {
    const hashedPassword = await bcrypt.hash('Customer@123', 10);
    const customer = await userRepo.save({
      email: data.email,
      passwordHash: hashedPassword,
      phone: '+1234567890',
      isActive: true,
      isVerified: true
    });
    customers.push(customer);
  }
  
  // Create additional customers
  for (let i = 4; i <= 20; i++) {
    const hashedPassword = await bcrypt.hash('Customer@123', 10);
    const customer = await userRepo.save({
      email: `customer${i}@test.com`,
      passwordHash: hashedPassword,
      phone: '+1234567890',
      isActive: true,
      isVerified: true
    });
    customers.push(customer);
  }
  
  return customers;
}

async function createBookingsAndReviews(dataSource: DataSource, customers: User[], providers: ServiceProvider[]) {
  console.log('📅 Creating bookings and reviews...');
  
  const bookingRepo = dataSource.getRepository(Booking);
  const reviewRepo = dataSource.getRepository(Review);
  const serviceRepo = dataSource.getRepository(Service);
  
  // Create past bookings with reviews
  for (let i = 0; i < 30; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const services = await serviceRepo.find({ where: { providerId: provider.id } });
    
    if (services.length === 0) continue;
    
    const service = services[Math.floor(Math.random() * services.length)];
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30) - 1);
    
    const booking = await bookingRepo.save({
      customerId: customer.id,  // camelCase as per entity definition
      providerId: provider.id,  // camelCase as per entity definition
      serviceId: service.id,    // camelCase as per entity definition
      scheduledDate: bookingDate,  // scheduledDate not bookingDate
      scheduledTime: '14:00:00',   // scheduledTime not startTime
      duration: service.durationMinutes,  // duration in minutes
      totalPrice: service.price,
      platformFee: Number(service.price) * 0.1,
      providerEarnings: Number(service.price) * 0.9,  // providerEarnings not providerEarning
      status: BookingStatus.COMPLETED,  // use enum
      paymentStatus: PaymentStatus.PAID,  // use enum
      paymentIntentId: `pi_test_${Math.random().toString(36).substr(2, 9)}`,  // paymentIntentId not stripePaymentIntentId
      customerNotes: 'Great service!'
    });
    
    // Create review for completed bookings
    if (Math.random() > 0.3) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
      await reviewRepo.save({
        booking_id: booking.id,    // snake_case as per entity definition
        customer_id: customer.id,  // snake_case as per entity definition
        provider_id: provider.id,  // snake_case as per entity definition
        rating,
        comment: [  // comment not reviewText
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
  
  // Create upcoming bookings
  for (let i = 0; i < 10; i++) {
    const customer = customers[Math.floor(Math.random() * Math.min(5, customers.length))];
    const provider = providers[Math.floor(Math.random() * Math.min(3, providers.length))];
    const services = await serviceRepo.find({ where: { providerId: provider.id } });
    
    if (services.length === 0) continue;
    
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
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      paymentIntentId: `pi_test_${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  console.log('✅ Created bookings and reviews');
}

bootstrap().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});