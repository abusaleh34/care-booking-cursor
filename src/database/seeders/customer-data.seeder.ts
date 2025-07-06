import { DataSource } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { ServiceProvider } from '../entities/service-provider.entity';
import { Service } from '../entities/service.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { RoleType, UserRole } from '../entities/user-role.entity';
import * as bcrypt from 'bcrypt';

export async function seedCustomerData(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding customer data...');

  const serviceCategories = await seedServiceCategories(dataSource);
  const providers = await seedServiceProviders(dataSource);
  await seedServices(dataSource, providers, serviceCategories);

  console.log('✅ Customer data seeded successfully');
}

async function seedServiceCategories(dataSource: DataSource): Promise<ServiceCategory[]> {
  const categoryRepository = dataSource.getRepository(ServiceCategory);

  const categories = [
    {
      name: 'Beauty & Wellness',
      description: 'Professional beauty and wellness services',
      iconUrl:
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=64&h=64&fit=crop&crop=center',
      sortOrder: 1,
    },
    {
      name: 'Massage Therapy',
      description: 'Relaxing and therapeutic massage services',
      iconUrl:
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=64&h=64&fit=crop&crop=center',
      sortOrder: 2,
    },
    {
      name: 'Hair & Styling',
      description: 'Professional hair care and styling services',
      iconUrl:
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=64&h=64&fit=crop&crop=center',
      sortOrder: 3,
    },
    {
      name: 'Fitness & Training',
      description: 'Personal training and fitness coaching',
      iconUrl:
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=64&h=64&fit=crop&crop=center',
      sortOrder: 4,
    },
    {
      name: 'Home Services',
      description: 'In-home professional services',
      iconUrl:
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=64&h=64&fit=crop&crop=center',
      sortOrder: 5,
    },
  ];

  const savedCategories: ServiceCategory[] = [];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      const savedCategory = await categoryRepository.save(category);
      savedCategories.push(savedCategory);
      console.log(`  📂 Created category: ${categoryData.name}`);
    } else {
      savedCategories.push(existingCategory);
    }
  }

  return savedCategories;
}

async function seedServiceProviders(dataSource: DataSource): Promise<ServiceProvider[]> {
  const userRepository = dataSource.getRepository(User);
  const userProfileRepository = dataSource.getRepository(UserProfile);
  const userRoleRepository = dataSource.getRepository(UserRole);
  const providerRepository = dataSource.getRepository(ServiceProvider);

  const providersData = [
    {
      email: 'sarah.wellness@example.com',
      businessName: "Sarah's Wellness Studio",
      businessDescription:
        'Professional wellness and beauty services with over 10 years of experience',
      businessAddress: '123 Wellness Ave, San Francisco, CA 94102',
      latitude: 37.7749,
      longitude: -122.4194,
      businessPhone: '+1-555-0101',
      businessEmail: 'contact@sarahwellness.com',
      licenseNumber: 'CA-WS-12345',
      firstName: 'Sarah',
      lastName: 'Johnson',
      isVerified: true,
      averageRating: 4.8,
      totalReviews: 127,
    },
    {
      email: 'mike.massage@example.com',
      businessName: "Mike's Massage Therapy",
      businessDescription:
        'Certified massage therapist specializing in deep tissue and Swedish massage',
      businessAddress: '456 Relaxation Blvd, Oakland, CA 94607',
      latitude: 37.8044,
      longitude: -122.2712,
      businessPhone: '+1-555-0102',
      businessEmail: 'mike@mikesmassage.com',
      licenseNumber: 'CA-MT-67890',
      firstName: 'Mike',
      lastName: 'Thompson',
      isVerified: true,
      averageRating: 4.9,
      totalReviews: 95,
    },
    {
      email: 'luna.hair@example.com',
      businessName: 'Luna Hair Studio',
      businessDescription: 'Modern hair styling and coloring with the latest techniques',
      businessAddress: '789 Style Street, Berkeley, CA 94704',
      latitude: 37.8715,
      longitude: -122.273,
      businessPhone: '+1-555-0103',
      businessEmail: 'hello@lunahair.com',
      licenseNumber: 'CA-HS-11111',
      firstName: 'Luna',
      lastName: 'Martinez',
      isVerified: true,
      averageRating: 4.7,
      totalReviews: 203,
    },
    {
      email: 'alex.fitness@example.com',
      businessName: 'Alex Personal Training',
      businessDescription: 'Certified personal trainer helping clients achieve their fitness goals',
      businessAddress: '321 Fitness Way, Palo Alto, CA 94301',
      latitude: 37.4419,
      longitude: -122.143,
      businessPhone: '+1-555-0104',
      businessEmail: 'alex@alexpersonaltraining.com',
      licenseNumber: 'CA-PT-22222',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      isVerified: true,
      averageRating: 4.6,
      totalReviews: 78,
    },
  ];

  const savedProviders: ServiceProvider[] = [];

  for (const providerData of providersData) {
    const existingUser = await userRepository.findOne({
      where: { email: providerData.email },
    });

    if (!existingUser) {
      // Create user
      const hashedPassword = await bcrypt.hash('provider123', 12);
      const user = userRepository.create({
        email: providerData.email,
        passwordHash: hashedPassword,
        isVerified: true,
        isActive: true,
      });
      const savedUser = await userRepository.save(user);

      // Create user profile
      const profile = userProfileRepository.create({
        userId: savedUser.id,
        firstName: providerData.firstName,
        lastName: providerData.lastName,
      });
      await userProfileRepository.save(profile);

      // Create user role
      const userRole = userRoleRepository.create({
        userId: savedUser.id,
        roleType: RoleType.SERVICE_PROVIDER,
        isActive: true,
      });
      await userRoleRepository.save(userRole);

      // Create service provider
      const provider = providerRepository.create({
        userId: savedUser.id,
        businessName: providerData.businessName,
        businessDescription: providerData.businessDescription,
        businessAddress: providerData.businessAddress,
        latitude: providerData.latitude,
        longitude: providerData.longitude,
        businessPhone: providerData.businessPhone,
        businessEmail: providerData.businessEmail,
        licenseNumber: providerData.licenseNumber,
        isVerified: providerData.isVerified,
        averageRating: providerData.averageRating,
        totalReviews: providerData.totalReviews,
      });

      const savedProvider = await providerRepository.save(provider);
      savedProviders.push(savedProvider);
      console.log(`  👨‍💼 Created provider: ${providerData.businessName}`);
    } else {
      const existingProvider = await providerRepository.findOne({
        where: { userId: existingUser.id },
      });
      if (existingProvider) {
        savedProviders.push(existingProvider);
      }
    }
  }

  return savedProviders;
}

async function seedServices(
  dataSource: DataSource,
  providers: ServiceProvider[],
  categories: ServiceCategory[],
): Promise<void> {
  const serviceRepository = dataSource.getRepository(Service);

  const servicesData = [
    // Sarah's Wellness Studio services
    {
      providerIndex: 0,
      categoryName: 'Beauty & Wellness',
      name: 'Full Body Facial Treatment',
      description:
        'Comprehensive facial treatment including cleansing, exfoliation, and moisturizing',
      durationMinutes: 90,
      price: 120.0,
      isHomeService: false,
    },
    {
      providerIndex: 0,
      categoryName: 'Beauty & Wellness',
      name: 'Aromatherapy Session',
      description: 'Relaxing aromatherapy treatment with essential oils',
      durationMinutes: 60,
      price: 85.0,
      isHomeService: true,
    },

    // Mike's Massage Therapy services
    {
      providerIndex: 1,
      categoryName: 'Massage Therapy',
      name: 'Deep Tissue Massage',
      description: 'Therapeutic deep tissue massage to relieve muscle tension',
      durationMinutes: 90,
      price: 110.0,
      isHomeService: true,
    },
    {
      providerIndex: 1,
      categoryName: 'Massage Therapy',
      name: 'Swedish Massage',
      description: 'Relaxing Swedish massage for stress relief',
      durationMinutes: 60,
      price: 90.0,
      isHomeService: true,
    },
    {
      providerIndex: 1,
      categoryName: 'Massage Therapy',
      name: 'Hot Stone Massage',
      description: 'Therapeutic massage using heated stones',
      durationMinutes: 75,
      price: 125.0,
      isHomeService: false,
    },

    // Luna Hair Studio services
    {
      providerIndex: 2,
      categoryName: 'Hair & Styling',
      name: 'Haircut & Style',
      description: 'Professional haircut with styling',
      durationMinutes: 60,
      price: 65.0,
      isHomeService: false,
    },
    {
      providerIndex: 2,
      categoryName: 'Hair & Styling',
      name: 'Hair Color & Highlights',
      description: 'Professional hair coloring and highlighting service',
      durationMinutes: 180,
      price: 180.0,
      isHomeService: false,
    },
    {
      providerIndex: 2,
      categoryName: 'Hair & Styling',
      name: 'Blowout Styling',
      description: 'Professional blowout and styling',
      durationMinutes: 45,
      price: 45.0,
      isHomeService: true,
    },

    // Alex Personal Training services
    {
      providerIndex: 3,
      categoryName: 'Fitness & Training',
      name: 'Personal Training Session',
      description: 'One-on-one personal training session',
      durationMinutes: 60,
      price: 75.0,
      isHomeService: true,
    },
    {
      providerIndex: 3,
      categoryName: 'Fitness & Training',
      name: 'Fitness Assessment',
      description: 'Comprehensive fitness assessment and plan development',
      durationMinutes: 90,
      price: 100.0,
      isHomeService: false,
    },
    {
      providerIndex: 3,
      categoryName: 'Fitness & Training',
      name: 'Group Training Session',
      description: 'Small group training session (2-4 people)',
      durationMinutes: 60,
      price: 50.0,
      isHomeService: true,
    },
  ];

  for (const serviceData of servicesData) {
    const provider = providers[serviceData.providerIndex];
    const category = categories.find((cat) => cat.name === serviceData.categoryName);

    if (provider && category) {
      const existingService = await serviceRepository.findOne({
        where: {
          providerId: provider.id,
          name: serviceData.name,
        },
      });

      if (!existingService) {
        const service = serviceRepository.create({
          providerId: provider.id,
          categoryId: category.id,
          name: serviceData.name,
          description: serviceData.description,
          durationMinutes: serviceData.durationMinutes,
          price: serviceData.price,
          isHomeService: serviceData.isHomeService,
        });

        await serviceRepository.save(service);
        console.log(`  🛍️ Created service: ${serviceData.name} for ${provider.businessName}`);
      }
    }
  }
}
