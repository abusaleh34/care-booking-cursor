import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  RawBody,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SearchService } from '../services/search.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';

import { GetProviderDetailsDto, SearchProvidersDto } from '../dto/search-providers.dto';
import {
  CancelBookingDto,
  CreateBookingDto,
  GetAvailabilityDto,
  PaymentDto,
  RescheduleBookingDto,
} from '../dto/create-booking.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RoleType } from '../../database/entities/user-role.entity';

@Controller('customer')
@UseGuards(ThrottlerGuard)
export class CustomerController {
  constructor(
    private readonly searchService: SearchService,
    private readonly bookingService: BookingService,
    private readonly paymentService: PaymentService,
  ) {}

  // ========== SERVICE DISCOVERY ENDPOINTS ==========

  @Public()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    const categories = await this.searchService.getCategories();
    return {
      success: true,
      data: categories,
    };
  }

  @Public()
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchProviders(@Query() searchDto: SearchProvidersDto) {
    const providers = await this.searchService.searchProviders(searchDto);
    return {
      success: true,
      data: providers,
    };
  }

  @Public()
  @Get('providers/:providerId')
  @HttpCode(HttpStatus.OK)
  async getProviderDetails(@Param() params: GetProviderDetailsDto) {
    const provider = await this.searchService.getProviderDetails(params.providerId);
    return {
      success: true,
      data: provider,
    };
  }

  @Public()
  @Get('availability')
  @HttpCode(HttpStatus.OK)
  async getAvailability(@Query() getAvailabilityDto: GetAvailabilityDto) {
    const availability = await this.bookingService.getAvailability(getAvailabilityDto);
    return {
      success: true,
      data: availability,
    };
  }

  // ========== BOOKING MANAGEMENT ENDPOINTS ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const booking = await this.bookingService.createBooking(
      user.sub || user.id,
      createBookingDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Get('bookings')
  @HttpCode(HttpStatus.OK)
  async getUserBookings(@CurrentUser() user: any) {
    const bookings = await this.bookingService.getUserBookings(user.sub || user.id);
    return {
      success: true,
      data: bookings,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Get('bookings/:bookingId')
  @HttpCode(HttpStatus.OK)
  async getBookingDetails(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    const booking = await this.bookingService.getBookingDetails(bookingId, user.sub || user.id);
    return {
      success: true,
      data: booking,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Put('bookings/:bookingId/reschedule')
  @HttpCode(HttpStatus.OK)
  async rescheduleBooking(
    @Param('bookingId') bookingId: string,
    @Body() rescheduleBookingDto: Omit<RescheduleBookingDto, 'bookingId'>,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const booking = await this.bookingService.rescheduleBooking(
      user.id,
      { ...rescheduleBookingDto, bookingId },
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Delete('bookings/:bookingId')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: Omit<CancelBookingDto, 'bookingId'>,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    await this.bookingService.cancelBooking(
      user.id,
      { ...cancelDto, bookingId },
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Booking cancelled successfully',
    };
  }

  // ========== CUSTOMER PROFILE ENDPOINTS ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getCustomerProfile(@CurrentUser() user: any) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        roles: user.roles,
        isVerified: user.isVerified,
      },
    };
  }

  // ========== PAYMENT ENDPOINTS ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Post('payments/process')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Body() paymentDto: PaymentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const result = await this.paymentService.processPayment(
      user.id,
      paymentDto,
      ipAddress,
      userAgent,
    );

    return {
      success: result.success,
      message: result.success
        ? 'Payment processed successfully'
        : 'Payment requires additional authentication',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Post('payments/:paymentIntentId/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('paymentIntentId') paymentIntentId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const result = await this.paymentService.confirmPayment(
      user.id,
      paymentIntentId,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Payment confirmed successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Post('payments/refund')
  @HttpCode(HttpStatus.OK)
  async processRefund(
    @Body() body: { bookingId: string; reason: string },
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    const result = await this.paymentService.processRefund(
      body.bookingId,
      user.id,
      body.reason,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Refund processed successfully',
      data: result,
    };
  }

  // ========== STRIPE WEBHOOK ENDPOINT ==========

  @Public()
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer,
  ) {
    await this.paymentService.handleWebhook(signature, payload);
    return { received: true };
  }

  // ========== RECOMMENDATIONS ENDPOINT ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.CUSTOMER)
  @Get('recommendations')
  @HttpCode(HttpStatus.OK)
  async getRecommendations(
    @CurrentUser() user: any,
    @Query() query: { latitude?: number; longitude?: number; limit?: number },
  ) {
    // This could be enhanced with AI-based recommendations based on user history
    const searchDto: SearchProvidersDto = {
      latitude: query.latitude,
      longitude: query.longitude,
      radius: 10, // 10km radius for recommendations
      verifiedOnly: true,
      sortBy: 'rating' as any,
      sortOrder: 'desc' as any,
      limit: query.limit || 10,
    };

    const results = await this.searchService.searchProviders(searchDto);

    return {
      success: true,
      message: 'Top-rated providers near you',
      data: results,
    };
  }

  // ========== SEARCH SUGGESTIONS ENDPOINT ==========

  @Public()
  @Get('suggestions')
  @HttpCode(HttpStatus.OK)
  async getSearchSuggestions(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    // This could be enhanced with a proper search suggestion engine
    const suggestions = [
      'Massage Therapy',
      'Hair Styling',
      'Nail Care',
      'Facial Treatment',
      'Personal Training',
      'Yoga Instruction',
      'Spa Services',
      'Beauty Consultation',
    ].filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase()));

    return {
      success: true,
      data: suggestions,
    };
  }
}
