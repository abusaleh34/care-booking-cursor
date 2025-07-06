import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from '../../database/entities/booking.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import {
  CancelBookingDto,
  CreateBookingDto,
  GetAvailabilityDto,
  RescheduleBookingDto,
} from '../dto/create-booking.dto';
import { AuditService } from '../../auth/services/audit.service';
import { AuditAction } from '../../database/entities/audit-log.entity';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface BookingResult {
  id: string;
  providerId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  provider: {
    id: string;
    businessName: string;
    businessAddress: string;
    businessPhone: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };
  createdAt: Date;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceProvider)
    private readonly serviceProviderRepository: Repository<ServiceProvider>,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createBooking(
    customerId: string,
    createBookingDto: CreateBookingDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<BookingResult> {
    try {
      const { providerId, serviceId, bookingDate, startTime, notes } = createBookingDto;
      
      this.logger.debug(`Creating booking for customer ${customerId}, provider ${providerId}, service ${serviceId}, date ${bookingDate}, time ${startTime}`);

    // Validate service and provider
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, isActive: true },
      relations: ['provider'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== providerId) {
      throw new BadRequestException('Service does not belong to the specified provider');
    }

    // Check if provider is loaded and active
    if (service.provider && !service.provider.isActive) {
      throw new BadRequestException('Service provider is not active');
    }
    
    // If provider not loaded, verify separately
    if (!service.provider) {
      const provider = await this.serviceProviderRepository.findOne({
        where: { id: providerId, isActive: true },
      });
      if (!provider) {
        throw new BadRequestException('Service provider is not active');
      }
    }

    // Calculate end time
    const endTime = this.calculateEndTime(startTime, service.durationMinutes);

    // Check availability
    const isAvailable = await this.checkTimeSlotAvailability(
      providerId,
      bookingDate,
      startTime,
      endTime,
    );

    if (!isAvailable) {
      throw new ConflictException('The selected time slot is not available');
    }

    // Validate booking date (must be future date)
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    const now = new Date();

    if (bookingDateTime <= now) {
      throw new BadRequestException('Booking date must be in the future');
    }

    // Check if booking is too far in advance (optional business rule)
    const maxAdvanceBookingDays = 90;
    const maxBookingDate = new Date();
    maxBookingDate.setDate(maxBookingDate.getDate() + maxAdvanceBookingDays);

    if (bookingDateTime > maxBookingDate) {
      throw new BadRequestException(
        `Bookings can only be made up to ${maxAdvanceBookingDays} days in advance`,
      );
    }

    // Create booking
    const price = Number(service.price);
    const booking = this.bookingRepository.create({
      customerId,
      providerId,
      serviceId,
      scheduledDate: new Date(bookingDate),
      scheduledTime: startTime,
      duration: service.durationMinutes,
      totalPrice: price,
      platformFee: price * 0.1,
      providerEarnings: price * 0.9,
      customerNotes: notes,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // Invalidate availability cache for this provider and date
    await this.cacheService.invalidateAvailability(providerId, bookingDate);

    // Get updated availability and notify via WebSocket
    const updatedAvailability = await this.getAvailability({
      providerId,
      serviceId,
      date: bookingDate,
    });

    this.realtimeGateway.notifyAvailabilityChange(providerId, bookingDate, updatedAvailability);

    // Get the saved booking with relations
    const bookingWithRelations = await this.bookingRepository.findOne({
      where: { id: savedBooking.id },
      relations: ['service', 'provider'],
    });
    
    // Notify provider about new booking
    const bookingResult = this.transformBookingResult(bookingWithRelations!, service);
    if (bookingWithRelations?.provider?.userId) {
      this.realtimeGateway.notifyNewBooking(bookingResult, bookingWithRelations.provider.userId);
    }

    // Log booking creation
    await this.auditService.log({
      userId: customerId,
      action: AuditAction.REGISTER, // You might want to add a BOOKING_CREATED action
      description: `Booking created for service ${service.name}`,
      ipAddress,
      userAgent,
      metadata: {
        bookingId: savedBooking.id,
        providerId,
        serviceId,
        bookingDate,
        startTime,
      },
    });

    return bookingResult;
    } catch (error) {
      this.logger.error(`Error creating booking: ${error.message}`, error.stack);
      this.logger.error('Full error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create booking: ${error.message}`);
    }
  }

  async getAvailability(getAvailabilityDto: GetAvailabilityDto): Promise<AvailabilitySlot[]> {
    try {
      const { providerId, serviceId, date } = getAvailabilityDto;
      
      this.logger.debug(`Getting availability for provider ${providerId}, service ${serviceId}, date ${date}`);

      // Try cache first
      try {
        const cachedAvailability = await this.cacheService.getAvailability(providerId, serviceId, date);
        if (cachedAvailability) {
          this.logger.debug(`Returning cached availability for ${providerId} on ${date}`);
          return cachedAvailability;
        }
      } catch (error) {
        this.logger.warn(`Cache error: ${error.message}`);
      }

    // Validate service
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, isActive: true },
    });

    if (!service || service.providerId !== providerId) {
      throw new NotFoundException('Service not found');
    }

    // Generate time slots for the day (9 AM to 6 PM, 30-minute intervals)
    const timeSlots = this.generateTimeSlots();

    // Get existing bookings for the day
    const existingBookings = await this.bookingRepository.find({
      where: {
        providerId,
        scheduledDate: new Date(date),
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
      },
    });

    // Mark unavailable slots
    const availability = timeSlots.map((slot) => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      const isOccupied = existingBookings.some((booking) => {
        const bookingStart = this.timeToMinutes(booking.startTime);
        const bookingEnd = this.timeToMinutes(booking.endTime);

        // Check for overlap
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      return {
        ...slot,
        available: !isOccupied,
      };
    });

    // Cache availability for 1 minute (short TTL since it changes frequently)
    await this.cacheService.setAvailability(providerId, serviceId, date, availability, 60);

    return availability;
    } catch (error) {
      this.logger.error(`Error getting availability: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserBookings(customerId: string): Promise<BookingResult[]> {
    try {
      this.logger.debug(`Getting bookings for customer ${customerId}`);
      
      const bookings = await this.bookingRepository.find({
        where: { customerId },
        relations: ['service', 'provider', 'customer', 'customer.profile'],
        order: { scheduledDate: 'DESC', scheduledTime: 'DESC' },
      });

      this.logger.debug(`Found ${bookings.length} bookings for customer ${customerId}`);
      
      return bookings.map((booking) => {
        try {
          return this.transformBookingResult(booking);
        } catch (error) {
          this.logger.error(`Error transforming booking ${booking.id}: ${error.message}`, error.stack);
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Error getting user bookings: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBookingDetails(bookingId: string, customerId: string): Promise<BookingResult> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId },
      relations: ['service', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.transformBookingResult(booking);
  }

  async cancelBooking(
    customerId: string,
    cancelBookingDto: CancelBookingDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const { bookingId, reason } = cancelBookingDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId },
      relations: ['service', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Check cancellation policy (24 hours in advance)
    const now = new Date();
    const bookingDateTime = new Date(
      `${booking.scheduledDate.toISOString().split('T')[0]}T${booking.startTime}`,
    );
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      throw new ForbiddenException('Bookings can only be cancelled up to 24 hours in advance');
    }

    // Update booking status
    await this.bookingRepository.update(bookingId, {
      status: BookingStatus.CANCELLED,
      notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}` : booking.notes,
    });

    // Invalidate availability cache
    const bookingDate = booking.scheduledDate.toISOString().split('T')[0];
    await this.cacheService.invalidateAvailability(booking.providerId, bookingDate);

    // Get updated availability and notify via WebSocket
    const updatedAvailability = await this.getAvailability({
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      date: bookingDate,
    });

    this.realtimeGateway.notifyAvailabilityChange(
      booking.providerId,
      bookingDate,
      updatedAvailability,
    );

    // Notify about booking cancellation
    this.realtimeGateway.notifyBookingCancelled(
      bookingId,
      customerId,
      booking.provider.userId,
      reason,
    );

    // Notify booking status change
    this.realtimeGateway.notifyBookingStatusChange(
      bookingId,
      BookingStatus.CANCELLED,
      customerId,
      booking.provider.userId,
    );

    // Log cancellation
    await this.auditService.log({
      userId: customerId,
      action: AuditAction.REGISTER,
      description: `Booking cancelled for service ${booking.service.name}`,
      ipAddress,
      userAgent,
      metadata: {
        bookingId,
        reason,
      },
    });
  }

  async rescheduleBooking(
    customerId: string,
    rescheduleBookingDto: RescheduleBookingDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<BookingResult> {
    const { bookingId, newBookingDate, newStartTime, notes } = rescheduleBookingDto;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, customerId },
      relations: ['service', 'provider'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only pending or confirmed bookings can be rescheduled');
    }

    // Calculate new end time
    const newEndTime = this.calculateEndTime(newStartTime, booking.service.durationMinutes);

    // Check availability for new slot
    const isAvailable = await this.checkTimeSlotAvailability(
      booking.providerId,
      newBookingDate,
      newStartTime,
      newEndTime,
      bookingId, // Exclude current booking from availability check
    );

    if (!isAvailable) {
      throw new ConflictException('The new time slot is not available');
    }

    // Store old dates for cache invalidation
    const oldDate = booking.scheduledDate.toISOString().split('T')[0];

    // Update booking
    await this.bookingRepository.update(bookingId, {
      scheduledDate: new Date(newBookingDate),
      startTime: newStartTime,
      endTime: newEndTime,
      notes: notes || booking.notes,
    });

    // Invalidate availability cache for both old and new dates
    await this.cacheService.invalidateAvailability(booking.providerId, oldDate);
    if (oldDate !== newBookingDate) {
      await this.cacheService.invalidateAvailability(booking.providerId, newBookingDate);
    }

    // Get updated availability for both dates and notify via WebSocket
    const oldAvailability = await this.getAvailability({
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      date: oldDate,
    });

    this.realtimeGateway.notifyAvailabilityChange(booking.providerId, oldDate, oldAvailability);

    if (oldDate !== newBookingDate) {
      const newAvailability = await this.getAvailability({
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        date: newBookingDate,
      });

      this.realtimeGateway.notifyAvailabilityChange(
        booking.providerId,
        newBookingDate,
        newAvailability,
      );
    }

    // Get updated booking
    const updatedBooking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['service', 'provider'],
    });

    // Notify booking status change
    this.realtimeGateway.notifyBookingStatusChange(
      bookingId,
      updatedBooking!.status,
      customerId,
      booking.provider.userId,
    );

    // Log rescheduling
    await this.auditService.log({
      userId: customerId,
      action: AuditAction.REGISTER,
      description: `Booking rescheduled for service ${booking.service.name}`,
      ipAddress,
      userAgent,
      metadata: {
        bookingId,
        oldDate: booking.scheduledDate,
        oldTime: booking.startTime,
        newDate: newBookingDate,
        newTime: newStartTime,
      },
    });

    return this.transformBookingResult(updatedBooking!);
  }

  private async checkTimeSlotAvailability(
    providerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<boolean> {
    // Get all bookings for the provider on the given date
    const bookings = await this.bookingRepository.find({
      where: {
        providerId,
        scheduledDate: new Date(date),
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
      },
    });

    // Filter out excluded booking if provided
    const relevantBookings = excludeBookingId 
      ? bookings.filter(b => b.id !== excludeBookingId)
      : bookings;

    // Check for time conflicts
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    for (const booking of relevantBookings) {
      const bookingStartMinutes = this.timeToMinutes(booking.scheduledTime);
      const bookingEndMinutes = bookingStartMinutes + booking.duration;

      // Check for overlap
      if (startMinutes < bookingEndMinutes && endMinutes > bookingStartMinutes) {
        return false;
      }
    }

    return true;
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;

    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  private generateTimeSlots(): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const intervalMinutes = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinutes = minute + intervalMinutes;
        const endHour = endMinutes >= 60 ? hour + 1 : hour;
        const endMin = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

        if (endHour <= 18) { // Don't exceed 6 PM
          slots.push({
            startTime,
            endTime,
            available: true,
          });
        }
      }
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private transformBookingResult(booking: Booking, service?: Service): BookingResult {
    try {
      // Handle scheduledDate whether it's a Date object or string
      const scheduledDate = booking.scheduledDate instanceof Date 
        ? booking.scheduledDate 
        : new Date(booking.scheduledDate);
      
      // Ensure scheduledTime is a string
      const scheduledTime = booking.scheduledTime || '00:00:00';
      const duration = booking.duration || service?.durationMinutes || 60;
      
      return {
        id: booking.id,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        bookingDate: scheduledDate.toISOString().split('T')[0],
        startTime: scheduledTime,
        endTime: booking.endTime || this.calculateEndTime(scheduledTime, duration),
        status: booking.status,
        totalAmount: Number(booking.totalPrice) || 0,
        notes: booking.customerNotes || '',
        provider: {
          id: booking.provider?.id || booking.providerId,
          businessName: booking.provider?.businessName || '',
          businessAddress: booking.provider?.businessAddress || '',
          businessPhone: booking.provider?.businessPhone || '',
        },
        service: {
          id: booking.service?.id || service?.id || booking.serviceId,
          name: booking.service?.name || service?.name || '',
          durationMinutes: booking.service?.durationMinutes || service?.durationMinutes || duration,
          price: Number(booking.service?.price || service?.price || booking.totalPrice) || 0,
        },
        createdAt: booking.createdAt || new Date(),
      };
    } catch (error) {
      this.logger.error(`Error in transformBookingResult for booking ${booking?.id}: ${error.message}`, error.stack);
      throw new Error(`Failed to transform booking result: ${error.message}`);
    }
  }
}
