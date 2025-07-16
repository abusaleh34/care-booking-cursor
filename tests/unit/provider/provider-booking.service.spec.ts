import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Between, In, Repository } from 'typeorm';

import { ProviderBookingService } from '../../../src/provider/services/provider-booking.service';
import { Booking, BookingStatus } from '../../../src/database/entities/booking.entity';
import { ServiceProvider } from '../../../src/database/entities/service-provider.entity';
import { CacheService } from '../../../src/cache/cache.service';
import { RealtimeGateway } from '../../../src/websocket/websocket.gateway';
import { BookingActionDto, BookingsQueryDto, RescheduleRequestDto } from '../../../src/provider/dto/provider.dto';

describe('ProviderBookingService', () => {
  let service: ProviderBookingService;
  let bookingRepository: Repository<Booking>;
  let providerRepository: Repository<ServiceProvider>;
  let cacheService: CacheService;
  let realtimeGateway: RealtimeGateway;

  const mockBooking = {
    id: 'booking-123',
    providerId: 'provider-123',
    customerId: 'customer-123',
    scheduledDate: new Date('2025-07-20'),
    scheduledTime: '14:00',
    bookingDateTime: new Date('2025-07-20T14:00:00'),
    totalPrice: 100,
    duration: 60,
    status: BookingStatus.PENDING,
    customer: {
      id: 'customer-123',
      email: 'customer@test.com',
      phone: '+1234567890',
      profile: {
        firstName: 'John',
        lastName: 'Doe'
      }
    },
    service: {
      id: 'service-123',
      name: 'Test Service',
      price: 100,
      durationMinutes: 60
    },
    reviews: []
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getCount: vi.fn().mockResolvedValue(1),
    getMany: vi.fn().mockResolvedValue([mockBooking])
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderBookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
            findOne: vi.fn(),
            find: vi.fn(),
            update: vi.fn(),
            count: vi.fn()
          }
        },
        {
          provide: getRepositoryToken(ServiceProvider),
          useValue: {
            findOne: vi.fn()
          }
        },
        {
          provide: CacheService,
          useValue: {
            invalidateAvailability: vi.fn(),
            invalidateProvider: vi.fn()
          }
        },
        {
          provide: RealtimeGateway,
          useValue: {
            notifyBookingStatusChange: vi.fn()
          }
        }
      ]
    }).compile();

    service = module.get<ProviderBookingService>(ProviderBookingService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    providerRepository = module.get(getRepositoryToken(ServiceProvider));
    cacheService = module.get(CacheService);
    realtimeGateway = module.get(RealtimeGateway);
  });

  describe('getBookings', () => {
    it('should return paginated bookings for a provider', async () => {
      const query: BookingsQueryDto = {
        page: 1,
        limit: 20,
        status: BookingStatus.PENDING
      };

      const result = await service.getBookings('provider-123', query);

      expect(result).toEqual({
        bookings: [{
          id: 'booking-123',
          customerName: 'John Doe',
          serviceName: 'Test Service',
          date: '2025-07-20',
          time: '14:00',
          amount: 100,
          status: BookingStatus.PENDING,
          customer: {
            id: 'customer-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'customer@test.com',
            phone: '+1234567890'
          },
          service: {
            id: 'service-123',
            name: 'Test Service',
            duration: 60,
            price: 100
          }
        }],
        total: 1,
        page: 1,
        limit: 20
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'booking.providerId = :providerId',
        { providerId: 'provider-123' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'booking.status = :status',
        { status: BookingStatus.PENDING }
      );
    });

    it('should filter by date range when provided', async () => {
      const query: BookingsQueryDto = {
        page: 1,
        limit: 20,
        startDate: '2025-07-01',
        endDate: '2025-07-31'
      };

      await service.getBookings('provider-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'booking.scheduledDate >= :startDate',
        { startDate: '2025-07-01' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'booking.scheduledDate <= :endDate',
        { endDate: '2025-07-31' }
      );
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      const result = await service.getBookings('provider-123', {});

      expect(result).toEqual({
        bookings: [],
        total: 0,
        page: 1,
        limit: 20
      });
    });

    it('should handle database errors', async () => {
      mockQueryBuilder.getMany.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getBookings('provider-123', {})).rejects.toThrow('Database error');
    });
  });

  describe('getBookingById', () => {
    it('should return a booking by id', async () => {
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(mockBooking as any);

      const result = await service.getBookingById('provider-123', 'booking-123');

      expect(result).toEqual(mockBooking);
      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-123', providerId: 'provider-123' },
        relations: ['customer', 'customer.profile', 'service', 'reviews']
      });
    });

    it('should throw NotFoundException when booking not found', async () => {
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(null);

      await expect(
        service.getBookingById('provider-123', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTodayBookings', () => {
    it('should return today\'s bookings', async () => {
      const todayBookings = [mockBooking];
      vi.mocked(bookingRepository.find).mockResolvedValueOnce(todayBookings as any);

      const result = await service.getTodayBookings('provider-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'booking-123',
        customerName: 'John Doe',
        serviceName: 'Test Service',
        status: BookingStatus.PENDING
      });

      const findCall = vi.mocked(bookingRepository.find).mock.calls[0][0];
      expect(findCall).toMatchObject({
        where: {
          providerId: 'provider-123',
          status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
        }
      });
    });

    it('should handle empty today bookings', async () => {
      vi.mocked(bookingRepository.find).mockResolvedValueOnce([]);

      const result = await service.getTodayBookings('provider-123');

      expect(result).toEqual([]);
    });
  });

  describe('handleBookingAction', () => {
    beforeEach(() => {
      vi.mocked(bookingRepository.findOne).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingRepository.update).mockResolvedValue({} as any);
    });

    it('should accept a pending booking', async () => {
      const action: BookingActionDto = { action: 'accept' };

      await service.handleBookingAction('provider-123', 'booking-123', action);

      expect(bookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.CONFIRMED
      });
      expect(cacheService.invalidateAvailability).toHaveBeenCalledWith('provider-123');
      expect(realtimeGateway.notifyBookingStatusChange).toHaveBeenCalled();
    });

    it('should decline a pending booking with reason', async () => {
      const action: BookingActionDto = { 
        action: 'decline',
        reason: 'Provider unavailable'
      };

      await service.handleBookingAction('provider-123', 'booking-123', action);

      expect(bookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.CANCELLED,
        notes: 'Provider unavailable'
      });
    });

    it('should complete a confirmed booking', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(confirmedBooking as any);

      const action: BookingActionDto = { action: 'complete' };

      await service.handleBookingAction('provider-123', 'booking-123', action);

      expect(bookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.COMPLETED
      });
    });

    it('should throw error for invalid action', async () => {
      const action: BookingActionDto = { action: 'invalid' as any };

      await expect(
        service.handleBookingAction('provider-123', 'booking-123', action)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid status transition', async () => {
      const completedBooking = { ...mockBooking, status: BookingStatus.COMPLETED };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(completedBooking as any);

      const action: BookingActionDto = { action: 'accept' };

      await expect(
        service.handleBookingAction('provider-123', 'booking-123', action)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when booking not found', async () => {
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(null);

      const action: BookingActionDto = { action: 'accept' };

      await expect(
        service.handleBookingAction('provider-123', 'nonexistent', action)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestReschedule', () => {
    it('should request reschedule for confirmed booking', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(confirmedBooking as any);

      const rescheduleDto: RescheduleRequestDto = {
        bookingId: 'booking-123',
        newDate: '2025-07-25',
        newTime: '15:00',
        reason: 'Schedule conflict'
      };

      await service.requestReschedule('provider-123', rescheduleDto);

      expect(realtimeGateway.notifyBookingStatusChange).toHaveBeenCalledWith(
        'booking-123',
        'reschedule_requested',
        'customer-123',
        'provider-123'
      );
    });

    it('should throw error for past date reschedule', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(confirmedBooking as any);

      const rescheduleDto: RescheduleRequestDto = {
        bookingId: 'booking-123',
        newDate: '2020-01-01',
        newTime: '15:00',
        reason: 'Test'
      };

      await expect(
        service.requestReschedule('provider-123', rescheduleDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for non-confirmed bookings', async () => {
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(mockBooking as any);

      const rescheduleDto: RescheduleRequestDto = {
        bookingId: 'booking-123',
        newDate: '2025-07-25',
        newTime: '15:00',
        reason: 'Test'
      };

      await expect(
        service.requestReschedule('provider-123', rescheduleDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startService', () => {
    it('should start a confirmed booking within 15 minutes of start time', async () => {
      const now = new Date();
      const bookingTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
      const confirmedBooking = { 
        ...mockBooking, 
        status: BookingStatus.CONFIRMED,
        bookingDateTime: bookingTime
      };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(confirmedBooking as any);

      await service.startService('provider-123', 'booking-123');

      expect(bookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.IN_PROGRESS
      });
      expect(realtimeGateway.notifyBookingStatusChange).toHaveBeenCalled();
    });

    it('should throw error when starting too early', async () => {
      const now = new Date();
      const bookingTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const confirmedBooking = { 
        ...mockBooking, 
        status: BookingStatus.CONFIRMED,
        bookingDateTime: bookingTime
      };
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(confirmedBooking as any);

      await expect(
        service.startService('provider-123', 'booking-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for non-confirmed bookings', async () => {
      vi.mocked(bookingRepository.findOne).mockResolvedValueOnce(mockBooking as any);

      await expect(
        service.startService('provider-123', 'booking-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProviderCalendar', () => {
    it('should return calendar events', async () => {
      const bookings = [{
        ...mockBooking,
        bookingDate: '2025-07-20',
        startTime: '14:00',
        endTime: '15:00',
        totalAmount: 100,
        notes: 'Test notes'
      }];
      vi.mocked(bookingRepository.find).mockResolvedValueOnce(bookings as any);

      const result = await service.getProviderCalendar(
        'provider-123',
        '2025-07-01',
        '2025-07-31'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'booking-123',
        title: 'Test Service - John Doe',
        status: BookingStatus.PENDING,
        customerName: 'John Doe',
        serviceName: 'Test Service',
        amount: 100,
        notes: 'Test notes'
      });
    });
  });

  describe('getBookingConflicts', () => {
    it('should find conflicting bookings', async () => {
      const conflictQuery = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([mockBooking])
      };
      vi.mocked(bookingRepository.createQueryBuilder).mockReturnValueOnce(conflictQuery as any);

      const conflicts = await service.getBookingConflicts(
        'provider-123',
        '2025-07-20',
        '14:00',
        '15:00'
      );

      expect(conflicts).toHaveLength(1);
      expect(conflictQuery.andWhere).toHaveBeenCalledWith(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime: '14:00', endTime: '15:00' }
      );
    });

    it('should exclude specified booking from conflicts', async () => {
      const conflictQuery = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([])
      };
      vi.mocked(bookingRepository.createQueryBuilder).mockReturnValueOnce(conflictQuery as any);

      const conflicts = await service.getBookingConflicts(
        'provider-123',
        '2025-07-20',
        '14:00',
        '15:00',
        'booking-123'
      );

      expect(conflicts).toHaveLength(0);
      expect(conflictQuery.andWhere).toHaveBeenCalledWith(
        'booking.id != :excludeBookingId',
        { excludeBookingId: 'booking-123' }
      );
    });
  });
});