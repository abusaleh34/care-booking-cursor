import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { BookingActionDto, BookingsQueryDto, RescheduleRequestDto } from '../dto/provider.dto';

@Injectable()
export class ProviderBookingService {
  private readonly logger = new Logger(ProviderBookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(ServiceProvider)
    private readonly providerRepository: Repository<ServiceProvider>,
    private readonly cacheService: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // ========== BOOKING QUERIES ==========

  async getBookings(
    providerId: string,
    query: BookingsQueryDto,
  ): Promise<{ bookings: any[]; total: number; page: number; limit: number }> {
    try {
      const { status, startDate, endDate, page = 1, limit = 20 } = query;

      const queryBuilder = this.bookingRepository
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.customer', 'customer')
        .leftJoinAndSelect('customer.profile', 'profile')
        .leftJoinAndSelect('booking.service', 'service')
        .where('booking.providerId = :providerId', { providerId });

      if (status) {
        queryBuilder.andWhere('booking.status = :status', { status });
      }

      if (startDate) {
        queryBuilder.andWhere('booking.scheduledDate >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('booking.scheduledDate <= :endDate', { endDate });
      }

      const total = await queryBuilder.getCount();

      const bookings = await queryBuilder
        .orderBy('booking.scheduledDate', 'DESC')
        .addOrderBy('booking.scheduledTime', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      // Transform bookings to match expected format
      const transformedBookings = bookings.map((booking) => ({
        id: booking.id,
        customerName:
          `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() ||
          'Unknown',
        serviceName: booking.service?.name || '',
        date:
          booking.scheduledDate instanceof Date
            ? booking.scheduledDate.toISOString().split('T')[0]
            : booking.scheduledDate,
        time: booking.scheduledTime,
        amount: booking.totalPrice,
        status: booking.status,
        customer: {
          id: booking.customer?.id,
          firstName: booking.customer?.profile?.firstName || '',
          lastName: booking.customer?.profile?.lastName || '',
          email: booking.customer?.email || '',
          phone: booking.customer?.phone || '',
        },
        service: {
          id: booking.service?.id,
          name: booking.service?.name || '',
          duration: booking.service?.durationMinutes || booking.duration || 0,
          price: booking.service?.price || booking.totalPrice,
        },
      }));

      return { bookings: transformedBookings, total, page, limit };
    } catch (error) {
      this.logger.error('Error getting provider bookings:', error);
      throw error;
    }
  }

  async getBookingById(providerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, providerId },
      relations: ['customer', 'customer.profile', 'service', 'reviews'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getTodayBookings(providerId: string): Promise<any[]> {
    try {
      this.logger.debug(`Getting today's bookings for provider ${providerId}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      this.logger.debug(`Today date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

      const bookings = await this.bookingRepository.find({
        where: {
          providerId,
          scheduledDate: Between(today, tomorrow),
          status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
        },
        relations: ['customer', 'customer.profile', 'service'],
        order: { scheduledTime: 'ASC' },
      });

      this.logger.debug(`Found ${bookings.length} bookings for today`);

      // Transform bookings to match expected format (same as getBookings)
      return bookings.map((booking) => ({
        id: booking.id,
        customerName:
          `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() ||
          'Unknown',
        serviceName: booking.service?.name || '',
        date:
          booking.scheduledDate instanceof Date
            ? booking.scheduledDate.toISOString().split('T')[0]
            : booking.scheduledDate,
        time: booking.scheduledTime,
        amount: booking.totalPrice,
        status: booking.status,
        customer: {
          id: booking.customer?.id,
          firstName: booking.customer?.profile?.firstName || '',
          lastName: booking.customer?.profile?.lastName || '',
          email: booking.customer?.email || '',
          phone: booking.customer?.phone || '',
        },
        service: {
          id: booking.service?.id,
          name: booking.service?.name || '',
          duration: booking.service?.durationMinutes || booking.duration || 0,
          price: booking.service?.price || booking.totalPrice,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting today bookings:', error);
      throw error;
    }
  }

  async getUpcomingBookings(providerId: string, days: number = 7): Promise<any[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const bookings = await this.bookingRepository.find({
        where: {
          providerId,
          scheduledDate: Between(today, futureDate),
          status: In([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
        },
        relations: ['customer', 'customer.profile', 'service'],
        order: { scheduledDate: 'ASC', scheduledTime: 'ASC' },
      });

      // Transform bookings to match expected format (same as getBookings)
      return bookings.map((booking) => ({
        id: booking.id,
        customerName:
          `${booking.customer?.profile?.firstName || ''} ${booking.customer?.profile?.lastName || ''}`.trim() ||
          'Unknown',
        serviceName: booking.service?.name || '',
        date:
          booking.scheduledDate instanceof Date
            ? booking.scheduledDate.toISOString().split('T')[0]
            : booking.scheduledDate,
        time: booking.scheduledTime,
        amount: booking.totalPrice,
        status: booking.status,
        customer: {
          id: booking.customer?.id,
          firstName: booking.customer?.profile?.firstName || '',
          lastName: booking.customer?.profile?.lastName || '',
          email: booking.customer?.email || '',
          phone: booking.customer?.phone || '',
        },
        service: {
          id: booking.service?.id,
          name: booking.service?.name || '',
          duration: booking.service?.durationMinutes || booking.duration || 0,
          price: booking.service?.price || booking.totalPrice,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting upcoming bookings:', error);
      throw error;
    }
  }

  // ========== BOOKING ACTIONS ==========

  async handleBookingAction(
    providerId: string,
    bookingId: string,
    action: BookingActionDto,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, providerId },
      relations: ['customer', 'service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    let newStatus: BookingStatus;
    let allowedCurrentStatuses: BookingStatus[];

    switch (action.action) {
      case 'accept':
        newStatus = BookingStatus.CONFIRMED;
        allowedCurrentStatuses = [BookingStatus.PENDING];
        break;
      case 'decline':
        newStatus = BookingStatus.CANCELLED;
        allowedCurrentStatuses = [BookingStatus.PENDING];
        break;
      case 'complete':
        newStatus = BookingStatus.COMPLETED;
        allowedCurrentStatuses = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    if (!allowedCurrentStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot ${action.action} booking with status ${booking.status}`,
      );
    }

    // Update booking status
    await this.bookingRepository.update(bookingId, {
      status: newStatus,
      ...(action.reason && { notes: action.reason }),
    });

    // Get updated booking
    const updatedBooking = await this.getBookingById(providerId, bookingId);

    // Invalidate cache
    await this.cacheService.invalidateAvailability(providerId);

    // Send real-time notifications
    this.realtimeGateway.notifyBookingStatusChange(
      bookingId,
      newStatus,
      booking.customerId,
      providerId,
    );

    // Special handling for completed bookings
    if (newStatus === BookingStatus.COMPLETED) {
      await this.handleBookingCompletion(booking);
    }

    return updatedBooking;
  }

  async requestReschedule(providerId: string, rescheduleDto: RescheduleRequestDto): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id: rescheduleDto.bookingId, providerId },
      relations: ['customer', 'service'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only reschedule confirmed bookings');
    }

    // Validate new date is not in the past
    const newDate = new Date(rescheduleDto.newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate < today) {
      throw new BadRequestException('Cannot reschedule to a past date');
    }

    // TODO: Check availability for new date/time
    // TODO: Send reschedule request to customer for approval

    // For now, we'll just send a notification
    this.realtimeGateway.notifyBookingStatusChange(
      booking.id,
      'reschedule_requested',
      booking.customerId,
      providerId,
    );

    // You would typically store the reschedule request and wait for customer approval
  }

  async startService(providerId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, providerId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only start confirmed bookings');
    }

    // Check if it's time to start (within 15 minutes of start time)
    const now = new Date();
    const bookingDateTime = booking.bookingDateTime;
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 15) {
      throw new BadRequestException('Cannot start service more than 15 minutes early');
    }

    await this.bookingRepository.update(bookingId, {
      status: BookingStatus.IN_PROGRESS,
    });

    const updatedBooking = await this.getBookingById(providerId, bookingId);

    this.realtimeGateway.notifyBookingStatusChange(
      bookingId,
      BookingStatus.IN_PROGRESS,
      booking.customerId,
      providerId,
    );

    return updatedBooking;
  }

  // ========== PRIVATE HELPERS ==========

  private async handleBookingCompletion(booking: Booking): Promise<void> {
    // Update provider statistics
    await this.updateProviderStats(booking.providerId);

    // TODO: Trigger payment processing
    // TODO: Send completion notifications
    // TODO: Request review from customer
  }

  private async updateProviderStats(providerId: string): Promise<void> {
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
    });

    if (!provider) return;

    // Recalculate provider statistics
    const completedBookings = await this.bookingRepository.count({
      where: { providerId, status: BookingStatus.COMPLETED },
    });

    // TODO: Update average rating, total reviews, etc.
    // This would involve calculating from the reviews table

    await this.cacheService.invalidateProvider(providerId);
  }

  // ========== CALENDAR HELPERS ==========

  async getProviderCalendar(
    providerId: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    const bookings = await this.bookingRepository.find({
      where: {
        providerId,
        bookingDate: Between(new Date(startDate), new Date(endDate)) as any,
        status: ['confirmed', 'in_progress', 'completed'] as any,
      },
      relations: ['customer', 'customer.profile', 'service'],
      order: { bookingDate: 'ASC', startTime: 'ASC' },
    });

    // Transform bookings into calendar events
    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.service.name} - ${booking.customer.profile?.firstName} ${booking.customer.profile?.lastName}`,
      start: new Date(`${booking.bookingDate}T${booking.startTime}`),
      end: new Date(`${booking.bookingDate}T${booking.endTime}`),
      status: booking.status,
      customerName: `${booking.customer.profile?.firstName} ${booking.customer.profile?.lastName}`,
      serviceName: booking.service.name,
      amount: booking.totalAmount,
      notes: booking.notes,
    }));
  }

  async getBookingConflicts(
    providerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<Booking[]> {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.providerId = :providerId', { providerId })
      .andWhere('booking.bookingDate = :date', { date })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'in_progress'],
      })
      .andWhere('(booking.startTime < :endTime AND booking.endTime > :startTime)', {
        startTime,
        endTime,
      });

    if (excludeBookingId) {
      query.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    return await query.getMany();
  }
}
