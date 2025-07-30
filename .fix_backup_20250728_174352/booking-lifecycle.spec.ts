import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingService } from '../../../src/customer/services/booking.service';
import { CacheService } from '../../../src/cache/cache.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { Service } from '../../../src/database/entities/service.entity';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { User } from '../../../src/database/entities/user.entity';
import { ProviderAvailability } from '../../../src/database/entities/provider-availability.entity';
import { ProviderBlockedTimes } from '../../../src/database/entities/provider-blocked-times.entity';

describe('Customer Booking Service - Complete Lifecycle', () => {
  let service: BookingService;
  let bookingRepository;
  let serviceRepository;
  let providerAvailabilityRepository;
  let providerBlockedTimesRepository;
  let cacheService;

  const mockUser = {
    id: 'user-123',
    email: 'customer@example.com',
    profile: { firstName: 'John', lastName: 'Doe' },
  };

  const mockProvider = {
    id: 'provider-123',
    businessName: 'Sarah\'s Wellness',
    user: { id: 'provider-user-123' },
    services: [],
  };

  const mockService = {
    id: 'service-123',
    name: 'Full Body Massage',
    price: 120,
    duration: 90,
    provider: mockProvider,
  };

  const mockAvailability = [
    {
      id: 'avail-1',
      provider: mockProvider,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '18:00',
    },
    {
      id: 'avail-2',
      provider: mockProvider,
      dayOfWeek: 2, // Tuesday
      startTime: '09:00',
      endTime: '18:00',
    },
  ];

  beforeEach(async () => {
    const mockBookingRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    };

    const mockServiceRepository = {
      findOne: vi.fn(),
    };

    const mockProviderAvailabilityRepository = {
      find: vi.fn(),
    };

    const mockProviderBlockedTimesRepository = {
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepository },
        { provide: getRepositoryToken(Service), useValue: mockServiceRepository },
        { provide: getRepositoryToken(ProviderAvailability), useValue: mockProviderAvailabilityRepository },
        { provide: getRepositoryToken(ProviderBlockedTimes), useValue: mockProviderBlockedTimesRepository },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    serviceRepository = module.get(getRepositoryToken(Service));
    providerAvailabilityRepository = module.get(getRepositoryToken(ProviderAvailability));
    providerBlockedTimesRepository = module.get(getRepositoryToken(ProviderBlockedTimes));
    cacheService = module.get<CacheService>(CacheService);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Booking Creation', () => {
    const createBookingDto = {
      providerId: 'provider-123',
      serviceId: 'service-123',
      bookingDate: '2025-06-15',
      startTime: '10:00',
      notes: 'First time customer',
    };

    it('should create a booking successfully', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.count.mockResolvedValue(0); // No conflicts
      
      const mockBooking = {
        id: 'booking-123',
        ...createBookingDto,
        customer: mockUser,
        service: mockService,
        provider: mockProvider,
        endTime: '11:30', // 90 minutes after start
        status: BookingStatus.PENDING,
        totalAmount: 120,
      };

      bookingRepository.create.mockReturnValue(mockBooking);
      bookingRepository.save.mockResolvedValue(mockBooking);

      const result = await service.createBooking(mockUser.id, createBookingDto);

      expect(result).toMatchObject({
        id: 'booking-123',
        status: BookingStatus.PENDING,
        totalAmount: 120,
      });
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should validate provider availability', async () => {
      const sundayBooking = {
        ...createBookingDto,
        bookingDate: '2025-06-14', // Sunday (no availability)
      };

      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);

      await expect(
        service.createBooking(mockUser.id, sundayBooking)
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent double booking', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.count.mockResolvedValue(1); // Conflict exists

      await expect(
        service.createBooking(mockUser.id, createBookingDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should check blocked times', async () => {
      const blockedTime = {
        provider: mockProvider,
        date: '2025-06-15',
        startTime: '09:00',
        endTime: '12:00',
      };

      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([blockedTime]);
      
      await expect(
        service.createBooking(mockUser.id, createBookingDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate end time based on service duration', async () => {
      const testCases = [
        { duration: 30, startTime: '10:00', expectedEnd: '10:30' },
        { duration: 60, startTime: '14:30', expectedEnd: '15:30' },
        { duration: 90, startTime: '16:00', expectedEnd: '17:30' },
        { duration: 120, startTime: '09:00', expectedEnd: '11:00' },
      ];

      for (const testCase of testCases) {
        serviceRepository.findOne.mockResolvedValue({
          ...mockService,
          duration: testCase.duration,
        });
        providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
        providerBlockedTimesRepository.find.mockResolvedValue([]);
        bookingRepository.count.mockResolvedValue(0);

        const mockBooking = {
          id: 'booking-test',
          startTime: testCase.startTime,
          endTime: testCase.expectedEnd,
        };

        bookingRepository.create.mockReturnValue(mockBooking);
        bookingRepository.save.mockResolvedValue(mockBooking);

        const result = await service.createBooking(mockUser.id, {
          ...createBookingDto,
          startTime: testCase.startTime,
        });

        expect(result.endTime).toBe(testCase.expectedEnd);
      }
    });

    it('should validate booking is within provider hours', async () => {
      const afterHoursBooking = {
        ...createBookingDto,
        startTime: '17:00', // Service ends at 18:30, past provider hours
      };

      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);

      await expect(
        service.createBooking(mockUser.id, afterHoursBooking)
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent booking in the past', async () => {
      const pastBooking = {
        ...createBookingDto,
        bookingDate: '2020-01-01',
      };

      serviceRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.createBooking(mockUser.id, pastBooking)
      ).rejects.toThrow(BadRequestException);
    });

    it('should invalidate cache after booking creation', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.count.mockResolvedValue(0);

      const mockBooking = { id: 'booking-123' };
      bookingRepository.create.mockReturnValue(mockBooking);
      bookingRepository.save.mockResolvedValue(mockBooking);

      await service.createBooking(mockUser.id, createBookingDto);

      expect(cacheService.del).toHaveBeenCalledWith(
        expect.stringContaining(`availability:${mockProvider.id}`)
      );
    });
  });

  describe('Booking Rescheduling', () => {
    const mockExistingBooking = {
      id: 'booking-123',
      customer: mockUser,
      provider: mockProvider,
      service: mockService,
      bookingDate: new Date('2025-06-15'),
      startTime: '10:00',
      endTime: '11:30',
      status: BookingStatus.CONFIRMED,
      totalAmount: 120,
    };

    it('should reschedule booking successfully', async () => {
      const rescheduleDto = {
        newDate: '2025-06-16',
        newTime: '14:00',
        reason: 'Schedule conflict',
      };

      bookingRepository.findOne.mockResolvedValue(mockExistingBooking);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.count.mockResolvedValue(0);

      const rescheduledBooking = {
        ...mockExistingBooking,
        bookingDate: new Date('2025-06-16'),
        startTime: '14:00',
        endTime: '15:30',
        status: BookingStatus.RESCHEDULED,
      };

      bookingRepository.save.mockResolvedValue(rescheduledBooking);

      const result = await service.rescheduleBooking(
        mockUser.id,
        'booking-123',
        rescheduleDto
      );

      expect(result.status).toBe(BookingStatus.RESCHEDULED);
      expect(result.startTime).toBe('14:00');
    });

    it('should prevent rescheduling someone else\'s booking', async () => {
      const otherUserBooking = {
        ...mockExistingBooking,
        customer: { id: 'other-user' },
      };

      bookingRepository.findOne.mockResolvedValue(otherUserBooking);

      await expect(
        service.rescheduleBooking(mockUser.id, 'booking-123', {
          newDate: '2025-06-16',
          newTime: '14:00',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent rescheduling cancelled bookings', async () => {
      const cancelledBooking = {
        ...mockExistingBooking,
        status: BookingStatus.CANCELLED,
      };

      bookingRepository.findOne.mockResolvedValue(cancelledBooking);

      await expect(
        service.rescheduleBooking(mockUser.id, 'booking-123', {
          newDate: '2025-06-16',
          newTime: '14:00',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent rescheduling completed bookings', async () => {
      const completedBooking = {
        ...mockExistingBooking,
        status: BookingStatus.COMPLETED,
      };

      bookingRepository.findOne.mockResolvedValue(completedBooking);

      await expect(
        service.rescheduleBooking(mockUser.id, 'booking-123', {
          newDate: '2025-06-16',
          newTime: '14:00',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should check availability for new time slot', async () => {
      bookingRepository.findOne.mockResolvedValue(mockExistingBooking);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.count.mockResolvedValue(1); // Conflict at new time

      await expect(
        service.rescheduleBooking(mockUser.id, 'booking-123', {
          newDate: '2025-06-16',
          newTime: '14:00',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Booking Cancellation', () => {
    const mockConfirmedBooking = {
      id: 'booking-123',
      customer: mockUser,
      provider: mockProvider,
      service: mockService,
      bookingDate: new Date('2025-06-15T10:00:00'),
      startTime: '10:00',
      status: BookingStatus.CONFIRMED,
      totalAmount: 120,
      createdAt: new Date('2025-06-10'),
    };

    it('should cancel booking with full refund (24+ hours notice)', async () => {
      const futureBooking = {
        ...mockConfirmedBooking,
        bookingDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      };

      bookingRepository.findOne.mockResolvedValue(futureBooking);
      bookingRepository.save.mockResolvedValue({
        ...futureBooking,
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Customer requested',
      });

      const result = await service.cancelBooking(mockUser.id, 'booking-123', 'Change of plans');

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.refundAmount).toBe(120); // Full refund
    });

    it('should cancel booking with 50% refund (2-24 hours notice)', async () => {
      const soonBooking = {
        ...mockConfirmedBooking,
        bookingDate: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      };

      bookingRepository.findOne.mockResolvedValue(soonBooking);
      bookingRepository.save.mockResolvedValue({
        ...soonBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking(mockUser.id, 'booking-123', 'Emergency');

      expect(result.refundAmount).toBe(60); // 50% refund
    });

    it('should cancel booking with no refund (< 2 hours notice)', async () => {
      const immediateBooking = {
        ...mockConfirmedBooking,
        bookingDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      };

      bookingRepository.findOne.mockResolvedValue(immediateBooking);
      bookingRepository.save.mockResolvedValue({
        ...immediateBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking(mockUser.id, 'booking-123', 'Last minute');

      expect(result.refundAmount).toBe(0); // No refund
    });

    it('should prevent cancelling someone else\'s booking', async () => {
      const otherUserBooking = {
        ...mockConfirmedBooking,
        customer: { id: 'other-user' },
      };

      bookingRepository.findOne.mockResolvedValue(otherUserBooking);

      await expect(
        service.cancelBooking(mockUser.id, 'booking-123', 'Not mine')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent cancelling already cancelled booking', async () => {
      const cancelledBooking = {
        ...mockConfirmedBooking,
        status: BookingStatus.CANCELLED,
      };

      bookingRepository.findOne.mockResolvedValue(cancelledBooking);

      await expect(
        service.cancelBooking(mockUser.id, 'booking-123', 'Cancel again')
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent cancelling completed booking', async () => {
      const completedBooking = {
        ...mockConfirmedBooking,
        status: BookingStatus.COMPLETED,
      };

      bookingRepository.findOne.mockResolvedValue(completedBooking);

      await expect(
        service.cancelBooking(mockUser.id, 'booking-123', 'Too late')
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent cancelling past booking', async () => {
      const pastBooking = {
        ...mockConfirmedBooking,
        bookingDate: new Date('2020-01-01'),
      };

      bookingRepository.findOne.mockResolvedValue(pastBooking);

      await expect(
        service.cancelBooking(mockUser.id, 'booking-123', 'Past booking')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Booking Retrieval', () => {
    it('should get user bookings with pagination', async () => {
      const mockBookings = [
        { id: 'booking-1', status: BookingStatus.CONFIRMED },
        { id: 'booking-2', status: BookingStatus.COMPLETED },
      ];

      bookingRepository.find.mockResolvedValue(mockBookings);
      bookingRepository.count.mockResolvedValue(5);

      const result = await service.getUserBookings(mockUser.id, {
        limit: 2,
        offset: 0,
        status: BookingStatus.CONFIRMED,
      });

      expect(result.bookings).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          customerId: mockUser.id,
          status: BookingStatus.CONFIRMED,
        }),
        take: 2,
        skip: 0,
      });
    });

    it('should get booking details', async () => {
      bookingRepository.findOne.mockResolvedValue(mockConfirmedBooking);

      const result = await service.getBookingDetails(mockUser.id, 'booking-123');

      expect(result).toEqual(mockConfirmedBooking);
    });

    it('should throw not found for non-existent booking', async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getBookingDetails(mockUser.id, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent accessing other user\'s booking details', async () => {
      const otherUserBooking = {
        ...mockConfirmedBooking,
        customer: { id: 'other-user' },
      };

      bookingRepository.findOne.mockResolvedValue(otherUserBooking);

      await expect(
        service.getBookingDetails(mockUser.id, 'booking-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Availability Checking', () => {
    it('should return available time slots', async () => {
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.find.mockResolvedValue([
        {
          bookingDate: new Date('2025-06-15'),
          startTime: '10:00',
          endTime: '11:30',
        },
      ]);

      const result = await service.checkAvailability(
        'provider-123',
        'service-123',
        '2025-06-15'
      );

      expect(result.slots).toBeDefined();
      expect(result.slots).not.toContain('10:00');
      expect(result.slots).not.toContain('10:30');
      expect(result.slots).not.toContain('11:00');
    });

    it('should handle provider blocked times', async () => {
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([
        {
          date: '2025-06-15',
          startTime: '14:00',
          endTime: '16:00',
        },
      ]);
      bookingRepository.find.mockResolvedValue([]);

      const result = await service.checkAvailability(
        'provider-123',
        'service-123',
        '2025-06-15'
      );

      expect(result.slots).not.toContain('14:00');
      expect(result.slots).not.toContain('14:30');
      expect(result.slots).not.toContain('15:00');
      expect(result.slots).not.toContain('15:30');
    });

    it('should use cache for availability', async () => {
      const cachedAvailability = {
        slots: ['09:00', '09:30', '10:00'],
      };

      cacheService.get.mockResolvedValue(cachedAvailability);

      const result = await service.checkAvailability(
        'provider-123',
        'service-123',
        '2025-06-15'
      );

      expect(result).toEqual(cachedAvailability);
      expect(providerAvailabilityRepository.find).not.toHaveBeenCalled();
    });

    it('should cache availability results', async () => {
      cacheService.get.mockResolvedValue(null);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.find.mockResolvedValue([]);

      await service.checkAvailability(
        'provider-123',
        'service-123',
        '2025-06-15'
      );

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('availability:provider-123'),
        expect.any(Object),
        60 // 1 minute TTL
      );
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce minimum advance booking time', async () => {
      const immediateBooking = {
        ...createBookingDto,
        bookingDate: new Date().toISOString().split('T')[0],
        startTime: new Date(Date.now() + 15 * 60 * 1000).toTimeString().slice(0, 5), // 15 minutes from now
      };

      serviceRepository.findOne.mockResolvedValue(mockService);

      await expect(
        service.createBooking(mockUser.id, immediateBooking)
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent overbooking same customer', async () => {
      const existingBooking = {
        id: 'existing-123',
        customer: mockUser,
        bookingDate: new Date('2025-06-15'),
        startTime: '10:00',
        endTime: '11:30',
        status: BookingStatus.CONFIRMED,
      };

      serviceRepository.findOne.mockResolvedValue(mockService);
      providerAvailabilityRepository.find.mockResolvedValue(mockAvailability);
      providerBlockedTimesRepository.find.mockResolvedValue([]);
      bookingRepository.find.mockResolvedValue([existingBooking]);

      await expect(
        service.createBooking(mockUser.id, {
          ...createBookingDto,
          startTime: '11:00', // Overlaps with existing
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle service-specific rules', async () => {
      const specialService = {
        ...mockService,
        requiresDeposit: true,
        depositAmount: 50,
        advanceBookingDays: 3,
      };

      serviceRepository.findOne.mockResolvedValue(specialService);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await expect(
        service.createBooking(mockUser.id, {
          ...createBookingDto,
          bookingDate: tomorrow.toISOString().split('T')[0],
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
}); 