"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const booking_service_1 = require("./booking.service");
const audit_service_1 = require("../../auth/services/audit.service");
const cache_service_1 = require("../../cache/cache.service");
const websocket_gateway_1 = require("../../websocket/websocket.gateway");
const booking_entity_1 = require("../../database/entities/booking.entity");
const service_entity_1 = require("../../database/entities/service.entity");
const service_provider_entity_1 = require("../../database/entities/service-provider.entity");
const common_1 = require("@nestjs/common");
const test_setup_1 = require("../../test-setup");
describe('BookingService', () => {
    let service;
    let mockBookingRepository;
    let mockServiceRepository;
    let mockProviderRepository;
    let mockAuditService;
    let mockCacheService;
    let mockRealtimeGateway;
    beforeEach(async () => {
        mockBookingRepository = (0, test_setup_1.createMockRepository)();
        mockServiceRepository = (0, test_setup_1.createMockRepository)();
        mockProviderRepository = (0, test_setup_1.createMockRepository)();
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                booking_service_1.BookingService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(booking_entity_1.Booking),
                    useValue: mockBookingRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(service_entity_1.Service),
                    useValue: mockServiceRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(service_provider_entity_1.ServiceProvider),
                    useValue: mockProviderRepository,
                },
                {
                    provide: audit_service_1.AuditService,
                    useValue: mockAuditService,
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: mockCacheService,
                },
                {
                    provide: websocket_gateway_1.RealtimeGateway,
                    useValue: mockRealtimeGateway,
                },
            ],
        }).compile();
        service = module.get(booking_service_1.BookingService);
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
            const mockService = (0, test_setup_1.createTestService)({
                id: 'service-id',
                price: 100,
                durationMinutes: 60,
                providerId: 'provider-id',
            });
            mockService.provider = {
                id: 'provider-id',
                isActive: true,
                userId: 'provider-user-id',
                businessName: 'Test Business',
                businessAddress: '123 Main St',
                businessPhone: '555-0123',
            };
            const mockBooking = {
                ...(0, test_setup_1.createTestBooking)({
                    id: 'booking-id',
                    customerId,
                    providerId: 'provider-id',
                    serviceId: 'service-id',
                    status: booking_entity_1.BookingStatus.PENDING,
                    scheduledDate: new Date(bookingDate),
                    scheduledTime: '10:00',
                }),
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
                getCount: jest.fn().mockResolvedValue(0),
            });
            mockBookingRepository.create.mockReturnValue(mockBooking);
            mockBookingRepository.save.mockResolvedValue(mockBooking);
            mockCacheService.getAvailability.mockResolvedValue(null);
            const result = await service.createBooking(customerId, createBookingDto, ipAddress, userAgent);
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
            await expect(service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ConflictException for time conflicts', async () => {
            const customerId = 'customer-id';
            const createBookingDto = {
                providerId: 'provider-id',
                serviceId: 'service-id',
                bookingDate: '2025-01-10',
                startTime: '10:00',
            };
            const mockService = (0, test_setup_1.createTestService)({
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
                getCount: jest.fn().mockResolvedValue(1),
            });
            await expect(service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent')).rejects.toThrow(common_1.ConflictException);
        });
        it('should throw BadRequestException for past booking times', async () => {
            const customerId = 'customer-id';
            const createBookingDto = {
                providerId: 'provider-id',
                serviceId: 'service-id',
                bookingDate: '2020-01-01',
                startTime: '10:00',
            };
            const mockService = (0, test_setup_1.createTestService)({
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
            await expect(service.createBooking(customerId, createBookingDto, '127.0.0.1', 'test-agent')).rejects.toThrow(common_1.BadRequestException);
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
            const mockService = (0, test_setup_1.createTestService)({
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
            await expect(service.getAvailability(getAvailabilityDto)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getUserBookings', () => {
        it('should return customer bookings', async () => {
            const customerId = 'customer-id';
            const mockBookings = [
                {
                    ...(0, test_setup_1.createTestBooking)({
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
                    service: (0, test_setup_1.createTestService)(),
                    provider: (0, test_setup_1.createTestProvider)(),
                },
                {
                    ...(0, test_setup_1.createTestBooking)({
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
                    service: (0, test_setup_1.createTestService)(),
                    provider: (0, test_setup_1.createTestProvider)(),
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
                ...(0, test_setup_1.createTestBooking)({
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
                service: (0, test_setup_1.createTestService)(),
                provider: (0, test_setup_1.createTestProvider)(),
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
            await expect(service.getBookingDetails(bookingId, customerId)).rejects.toThrow(common_1.NotFoundException);
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
            futureDate.setDate(futureDate.getDate() + 2);
            const mockBooking = (0, test_setup_1.createTestBooking)({
                id: 'booking-id',
                customerId,
                status: booking_entity_1.BookingStatus.PENDING,
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
                status: booking_entity_1.BookingStatus.CANCELLED,
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
            nearFutureDate.setHours(nearFutureDate.getHours() + 1);
            const mockBooking = (0, test_setup_1.createTestBooking)({
                id: 'booking-id',
                customerId,
                status: booking_entity_1.BookingStatus.PENDING,
                bookingDate: nearFutureDate,
                startTime: '10:00',
            });
            mockBookingRepository.findOne.mockResolvedValue(mockBooking);
            await expect(service.cancelBooking(customerId, cancelBookingDto, '127.0.0.1', 'test-agent')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
//# sourceMappingURL=booking.service.spec.js.map