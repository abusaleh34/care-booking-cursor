import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { Service } from '../../database/entities/service.entity';
import { ProviderAvailability } from '../../database/entities/provider-availability.entity';
import { ProviderBlockedTimes } from '../../database/entities/provider-blocked-times.entity';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import {
  BlockTimeDto,
  CreateServiceDto,
  SetAvailabilityDto,
  UpdateBusinessProfileDto,
  UpdateServiceDto,
} from '../dto/provider.dto';

@Injectable()
export class ProviderBusinessService {
  constructor(
    @InjectRepository(ServiceProvider)
    private readonly providerRepository: Repository<ServiceProvider>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ProviderAvailability)
    private readonly availabilityRepository: Repository<ProviderAvailability>,
    @InjectRepository(ProviderBlockedTimes)
    private readonly blockedTimesRepository: Repository<ProviderBlockedTimes>,
    private readonly cacheService: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // ========== BUSINESS PROFILE MANAGEMENT ==========

  async getProviderByUserId(userId: string): Promise<ServiceProvider | null> {
    return await this.providerRepository.findOne({
      where: { userId },
    });
  }

  async getBusinessProfile(providerId: string): Promise<ServiceProvider> {
    const cached = await this.cacheService.getProvider(providerId);
    if (cached) return cached;

    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['user', 'services', 'reviews'],
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    await this.cacheService.setProvider(providerId, provider, 600);
    return provider;
  }

  async updateBusinessProfile(
    providerId: string,
    updateData: UpdateBusinessProfileDto,
  ): Promise<ServiceProvider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Update provider data
    await this.providerRepository.update(providerId, {
      ...(updateData.businessName && { businessName: updateData.businessName }),
      ...(updateData.businessDescription && {
        businessDescription: updateData.businessDescription,
      }),
      ...(updateData.businessAddress && { businessAddress: updateData.businessAddress }),
      ...(updateData.latitude && { latitude: updateData.latitude }),
      ...(updateData.longitude && { longitude: updateData.longitude }),
      ...(updateData.businessPhone && { businessPhone: updateData.businessPhone }),
      ...(updateData.businessEmail && { businessEmail: updateData.businessEmail }),
    });

    // Invalidate cache
    await this.cacheService.invalidateProvider(providerId);

    const updatedProvider = await this.getBusinessProfile(providerId);

    // Broadcast update to real-time listeners
    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'profile_updated',
      data: updatedProvider,
    });

    return updatedProvider;
  }

  // ========== SERVICE MANAGEMENT ==========

  async getServices(providerId: string): Promise<Service[]> {
    const services = await this.serviceRepository.find({
      where: { providerId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    return services;
  }

  async createService(providerId: string, createServiceDto: CreateServiceDto): Promise<Service> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      providerId,
      isActive: createServiceDto.isActive ?? true,
    });

    const savedService = await this.serviceRepository.save(service);

    // Invalidate provider cache
    await this.cacheService.invalidateProvider(providerId);

    // Broadcast new service
    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'service_created',
      data: savedService,
    });

    return savedService;
  }

  async updateService(
    providerId: string,
    serviceId: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, providerId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.serviceRepository.update(serviceId, updateServiceDto);

    // Invalidate cache
    await this.cacheService.invalidateProvider(providerId);

    const updatedService = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['category'],
    });

    // Broadcast update
    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'service_updated',
      data: updatedService,
    });

    return updatedService;
  }

  async deleteService(providerId: string, serviceId: string): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, providerId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if service has active bookings
    // TODO: Add booking check logic

    await this.serviceRepository.delete(serviceId);

    // Invalidate cache
    await this.cacheService.invalidateProvider(providerId);

    // Broadcast deletion
    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'service_deleted',
      data: { serviceId },
    });
  }

  // ========== AVAILABILITY MANAGEMENT ==========

  async getAvailability(providerId: string): Promise<ProviderAvailability[]> {
    return await this.availabilityRepository.find({
      where: { provider_id: providerId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async setAvailability(
    providerId: string,
    setAvailabilityDto: SetAvailabilityDto,
  ): Promise<ProviderAvailability[]> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Remove existing availability
    await this.availabilityRepository.delete({ provider_id: providerId });

    // Create new availability slots
    const availabilitySlots = setAvailabilityDto.availability.map((slot) =>
      this.availabilityRepository.create({
        provider_id: providerId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable ?? true,
      }),
    );

    const savedSlots = await this.availabilityRepository.save(availabilitySlots);

    // Invalidate availability cache
    await this.cacheService.invalidateAvailability(providerId);

    // Broadcast availability update
    this.realtimeGateway.notifyAvailabilityChange(providerId, '', {
      type: 'availability_updated',
      data: savedSlots,
    });

    return savedSlots;
  }

  async getBlockedTimes(
    providerId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ProviderBlockedTimes[]> {
    const query = this.blockedTimesRepository
      .createQueryBuilder('blocked')
      .where('blocked.provider_id = :providerId', { providerId });

    if (startDate) {
      query.andWhere('blocked.blocked_date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('blocked.blocked_date <= :endDate', { endDate });
    }

    return await query
      .orderBy('blocked.blocked_date', 'ASC')
      .addOrderBy('blocked.start_time', 'ASC')
      .getMany();
  }

  async blockTime(providerId: string, blockTimeDto: BlockTimeDto): Promise<ProviderBlockedTimes> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Validate that the date is not in the past
    const blockDate = new Date(blockTimeDto.blockedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (blockDate < today) {
      throw new BadRequestException('Cannot block time in the past');
    }

    const blockedTime = this.blockedTimesRepository.create({
      provider_id: providerId,
      blocked_date: blockDate,
      start_time: blockTimeDto.startTime,
      end_time: blockTimeDto.endTime,
      reason: blockTimeDto.reason,
      is_recurring: blockTimeDto.isRecurring ?? false,
    });

    const savedBlockedTime = await this.blockedTimesRepository.save(blockedTime);

    // Invalidate availability cache for this date
    await this.cacheService.invalidateAvailability(providerId, blockTimeDto.blockedDate);

    // Broadcast blocked time update
    this.realtimeGateway.notifyAvailabilityChange(providerId, blockTimeDto.blockedDate, {
      type: 'time_blocked',
      date: blockTimeDto.blockedDate,
      data: savedBlockedTime,
    });

    return savedBlockedTime;
  }

  async unblockTime(providerId: string, blockedTimeId: string): Promise<void> {
    const blockedTime = await this.blockedTimesRepository.findOne({
      where: { id: blockedTimeId, provider_id: providerId },
    });

    if (!blockedTime) {
      throw new NotFoundException('Blocked time not found');
    }

    const blockedDate = blockedTime.blocked_date.toISOString().split('T')[0];

    await this.blockedTimesRepository.delete(blockedTimeId);

    // Invalidate availability cache for this date
    await this.cacheService.invalidateAvailability(providerId, blockedDate);

    // Broadcast unblock update
    this.realtimeGateway.notifyAvailabilityChange(providerId, blockedDate, {
      type: 'time_unblocked',
      date: blockedDate,
      data: { blockedTimeId },
    });
  }

  // ========== PORTFOLIO MANAGEMENT ==========

  async uploadPortfolioImage(providerId: string, imageUrl: string): Promise<ServiceProvider> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // TODO: Implement portfolio image storage
    // For now, we'll update the business description to include image references
    // In production, you'd have a separate portfolio/gallery table

    await this.cacheService.invalidateProvider(providerId);

    const updatedProvider = await this.getBusinessProfile(providerId);

    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'portfolio_updated',
      data: { imageUrl },
    });

    return updatedProvider;
  }

  async deletePortfolioImage(providerId: string, imageUrl: string): Promise<void> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // TODO: Implement portfolio image deletion
    // Remove from storage and update database

    await this.cacheService.invalidateProvider(providerId);

    this.realtimeGateway.notifyProviderUpdated(providerId, {
      type: 'portfolio_updated',
      data: { deletedImageUrl: imageUrl },
    });
  }

  // ========== ANALYTICS HELPERS ==========

  async getServicePerformance(providerId: string): Promise<any[]> {
    const services = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoin('service.bookings', 'booking')
      .leftJoin('service.reviews', 'review')
      .where('service.providerId = :providerId', { providerId })
      .select([
        'service.id',
        'service.name',
        'service.price',
        'COUNT(DISTINCT booking.id) as totalBookings',
        'COUNT(DISTINCT CASE WHEN booking.status = "completed" THEN booking.id END) as completedBookings',
        'AVG(CASE WHEN booking.status = "completed" THEN booking.totalAmount END) as averageRevenue',
        'AVG(review.rating) as averageRating',
        'COUNT(DISTINCT review.id) as totalReviews',
      ])
      .groupBy('service.id')
      .getRawMany();

    return services.map((service) => ({
      ...service,
      completionRate:
        service.totalBookings > 0 ? service.completedBookings / service.totalBookings : 0,
    }));
  }
}
