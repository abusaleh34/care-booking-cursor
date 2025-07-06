import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { AuditService } from '../../auth/services/audit.service';
import { CacheService } from '../../cache/cache.service';
import { RealtimeGateway } from '../../websocket/websocket.gateway';
import { Booking, BookingStatus } from '../../database/entities/booking.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceProvider } from '../../database/entities/service-provider.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { createMockRepository, createTestBooking, createTestService, createTestProvider } from '../../test-setup';

describe('BookingService', () => {
  let service: BookingService;
  let mockBookingRepository: any;
  let mockServiceRepository: any;
  let mockProviderRepository: any;
  let mockAuditService: any;
  let mockCacheService: any;
  let mockRealtimeGateway: any;

  beforeEach(async () => {
    mockBookingRepository = createMockRepository();
    mockServiceRepository = createMockRepository();
    mockProviderRepository = createMockRepository();

    mockAuditService = {
      log: jest.fn(),
    };

    mockCacheService = {
      getAvailability: jest.fn(),
      setAvailability: jest.fn(),
      invalidateAvailability: jest.fn(),
    };

    mockRealtimeGateway = {
      notifyAvailabilityChange: jest.fn(),
      notifyNewBooking: jest.fn(),
      notifyBookingCancelled: jest.fn(),
      notifyBookingStatusChange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: mockProviderRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    it('should successfully create a booking', async () => {
      const customerId = 'customer-id';
      // Use a date 7 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const bookingDate = futureDate.toISOString().split('T')[0];
      
      const createBookingDto = {
        providerId: 'provider-id',
        serviceId: 'service-id',
        bookingDate,
        startTime: '10:00',
        notes: 'Test booking',
      };
      const ipAddress = '127.0.0.1';
      const userAgent = 'test-agent';

      const mockService: any = createTestService({
        id: 'service-id',
        price: 100,
        durationMinutes: 60,
        providerId: 'provider-id',
      });
      
      // Add provider property
      mockService.provider = {
        id: 'provider-id',
        isActive: true,
        userId: 'provider-user-id',
        businessName: 'Test Business',
        businessAddress: '123 Main St',
        businessPhone: '555-0123',
      };

      const mockBooking = {
        ...createTestBooking({
          id: 'booking-id',
          customerId,
          providerId: 'provider-id',
          serviceId: 'service-id',
          status: BookingStatus.PENDING,
          scheduledDate: new Date(bookingDate),
          scheduledTime: '10:00',
        }),
        // Add virtual properties
        get bookingDate() {
          return this.scheduledDate;
        },
        get startTime() {
          return this.scheduledTime;
        },
        get endTime() {
          return '11:00';
        },
        get totalAmount() {
          return this.totalPrice;
        },
        get notes() {
          return this.customerNotes || '';
        },
        service: mockService,
        provider: mockService.provider,
      };

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0), // No conflicts
      });
      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);
      mockCacheService.getAvailability.mockResolvedValue(null);

      const result = await service.createBooking(
        customerId,
        createBookingDto,
        ipAddress,
        userAgent,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('booking-id');
      expect(mockBookingRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockRealtimeGateway.notifyNewBooking).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid service', async () => {
      const customerId = 'customer-id';
      const createBookingDto = {
        providerId: 'provider-id',
        serviceId: 'invalid-service-id',
        bookingDate: '2025-01-10',
        startTime: '10:00',
      };

      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for time conflicts', async () => {
      const customerId = 'customer-id';
      const createBookingDto = {
        providerId: 'provider-id',
        serviceId: 'service-id',
        bookingDate: '2025-01-10',
        startTime: '10:00',
      };

      const mockService = createTestService({
        id: 'service-id',
        providerId: 'provider-id',
        provider: {
          id: 'provider-id',
          isActive: true,
          userId: 'provider-user-id',
        },
      });

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1), // Conflict found
      });

      await expect(
        service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past booking times', async () => {
      const customerId = 'customer-id';
      const createBookingDto = {
        providerId: 'provider-id',
        serviceId: 'service-id',
        bookingDate: '2020-01-01', // Past date
        startTime: '10:00',
      };

      const mockService = createTestService({
        id: 'service-id',
        providerId: 'provider-id',
        provider: { isActive: true },
      });

      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockBookingRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });

      await expect(
        service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailability', () => {
    it('should return cached availability when available', async () => {
      const getAvailabilityDto = {
        providerId: 'provider-id',
        serviceId: 'service-id',
        date: '2025-01-10',
      };

      const cachedAvailability = [
        { startTime: '09:00', endTime: '09:30', available: true },
        { startTime: '09:30', endTime: '10:00', available: false },
      ];

      mockCacheService.getAvailability.mockResolvedValue(cachedAvailability);

      const result = await service.getAvailability(getAvailabilityDto);

      expect(result).toEqual(cachedAvailability);
      expect(mockServiceRepository.findOne).not.toHaveBeenCalled();
    });

    it('should calculate availability when not cached', async () => {
      const getAvailabilityDto = {
        providerId: 'provider-id',
        serviceId: 'service-id',
        date: '2025-01-10',
      };

      const mockService = createTestService({
        id: 'service-id',
        providerId: 'provider-id',
      });

      mockCacheService.getAvailability.mockResolvedValue(null);
      mockServiceRepository.findOne.mockResolvedValue(mockService);
      mockBookingRepository.find.mockResolvedValue([]);

      const result = await service.getAvailability(getAvailabilityDto);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockCacheService.setAvailability).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid service', async () => {
      const getAvailabilityDto = {
        providerId: 'provider-id',
        serviceId: 'invalid-service-id',
        date: '2025-01-10',
      };

      mockCacheService.getAvailability.mockResolvedValue(null);
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(service.getAvailability(getAvailabilityDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserBookings', () => {
    it('should return customer bookings', async () => {
      const customerId = 'customer-id';
      const mockBookings = [
        {
          ...createTestBooking({ 
            id: 'booking-1', 
            customerId,
            scheduledDate: new Date('2025-01-10'),
            scheduledTime: '10:00',
          }),
          get bookingDate() { return this.scheduledDate; },
          get startTime() { return this.scheduledTime; },
          get endTime() { return '11:00'; },
          get totalAmount() { return this.totalPrice; },
          get notes() { return this.customerNotes || ''; },
          service: createTestService(),
          provider: createTestProvider(),
        },
        {
          ...createTestBooking({ 
            id: 'booking-2', 
            customerId,
            scheduledDate: new Date('2025-01-11'),
            scheduledTime: '14:00',
          }),
          get bookingDate() { return this.scheduledDate; },
          get startTime() { return this.scheduledTime; },
          get endTime() { return '15:00'; },
          get totalAmount() { return this.totalPrice; },
          get notes() { return this.customerNotes || ''; },
          service: createTestService(),
          provider: createTestProvider(),
        },
      ];

      mockBookingRepository.find.mockResolvedValue(mockBookings);

      const result = await service.getUserBookings(customerId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockBookingRepository.find).toHaveBeenCalledWith({
        where: { customerId },
        relations: ['service', 'provider'],
        order: { bookingDate: 'DESC', startTime: 'DESC' },
      });
    });
  });

  describe('getBookingDetails', () => {
    it('should return booking details', async () => {
      const bookingId = 'booking-id';
      const customerId = 'customer-id';
      const mockBooking = {
        ...createTestBooking({ 
          id: bookingId, 
          customerId,
          scheduledDate: new Date('2025-01-10'),
          scheduledTime: '10:00',
        }),
        get bookingDate() { return this.scheduledDate; },
        get startTime() { return this.scheduledTime; },
        get endTime() { return '11:00'; },
        get totalAmount() { return this.totalPrice; },
        get notes() { return this.customerNotes || ''; },
        service: createTestService(),
        provider: createTestProvider(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetails(bookingId, customerId);

      expect(result).toBeDefined();
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: bookingId, customerId },
        relations: ['service', 'provider'],
      });
    });

    it('should throw NotFoundException for invalid booking', async () => {
      const bookingId = 'invalid-booking-id';
      const customerId = 'customer-id';

      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getBookingDetails(bookingId, customerId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelBooking', () => {
    it('should successfully cancel booking', async () => {
      const customerId = 'customer-id';
      const cancelBookingDto = {
        bookingId: 'booking-id',
        reason: 'Changed plans',
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 2 days from now

      const mockBooking = createTestBooking({
        id: 'booking-id',
        customerId,
        status: BookingStatus.PENDING,
        bookingDate: futureDate,
        startTime: '10:00',
        service: { name: 'Test Service' },
        provider: { userId: 'provider-user-id' },
      });

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.update.mockResolvedValue({ affected: 1 });
      mockCacheService.getAvailability.mockResolvedValue([]);

      await service.cancelBooking(customerId, cancelBookingDto, '127.0.0.1', 'test-agent');

      expect(mockBookingRepository.update).toHaveBeenCalledWith('booking-id', {
        status: BookingStatus.CANCELLED,
        notes: expect.stringContaining('Cancellation reason: Changed plans'),
      });
      expect(mockRealtimeGateway.notifyBookingCancelled).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for late cancellation', async () => {
      const customerId = 'customer-id';
      const cancelBookingDto = {
        bookingId: 'booking-id',
        reason: 'Changed plans',
      };

      const nearFutureDate = new Date();
      nearFutureDate.setHours(nearFutureDate.getHours() + 1); // 1 hour from now

      const mockBooking = createTestBooking({
        id: 'booking-id',
        customerId,
        status: BookingStatus.PENDING,
        bookingDate: nearFutureDate,
        startTime: '10:00',
      });

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      await expect(
        service.cancelBooking(customerId, cancelBookingDto, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
