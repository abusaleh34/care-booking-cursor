import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../database/entities/user-role.entity';

// Services
import { ProviderDashboardService } from './services/provider-dashboard.service';
import { ProviderBusinessService } from './services/provider-business.service';
import { ProviderBookingService } from './services/provider-booking.service';
import { ProviderMessagingService } from './services/provider-messaging.service';

// DTOs
import {
  AnalyticsFilterDto,
  BlockTimeDto,
  BookingActionDto,
  BookingsQueryDto,
  CreateConversationDto,
  CreateServiceDto,
  EarningsFilterDto,
  MessagesQueryDto,
  PayoutRequestDto,
  RescheduleRequestDto,
  RespondToReviewDto,
  SendMessageDto,
  SetAvailabilityDto,
  UpdateBusinessProfileDto,
  UpdateServiceDto,
} from './dto/provider.dto';

@Controller('provider')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.SERVICE_PROVIDER)
export class ProviderController {
  private async getProviderId(userId: string): Promise<string> {
    const provider = await this.businessService.getProviderByUserId(userId);
    if (!provider) {
      throw new NotFoundException('Service provider profile not found');
    }
    return provider.id;
  }
  constructor(
    private readonly dashboardService: ProviderDashboardService,
    private readonly businessService: ProviderBusinessService,
    private readonly bookingService: ProviderBookingService,
    private readonly messagingService: ProviderMessagingService,
  ) {}

  // ========== DASHBOARD ENDPOINTS ==========

  @Get('dashboard')
  async getDashboard(@Request() req) {
    // Get the service provider by user ID
    const provider = await this.businessService.getProviderByUserId(req.user.sub);
    if (!provider) {
      throw new NotFoundException('Service provider profile not found');
    }
    return await this.dashboardService.getDashboardOverview(provider.id);
  }

  @Get('analytics')
  async getAnalytics(@Request() req, @Query() filter: AnalyticsFilterDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.dashboardService.getAnalyticsData(providerId, filter);
  }

  @Get('earnings')
  async getEarnings(@Request() req, @Query() filter: EarningsFilterDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.dashboardService.getEarningsData(providerId, filter);
  }

  // ========== BUSINESS PROFILE ENDPOINTS ==========

  @Get('profile')
  async getBusinessProfile(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.getBusinessProfile(providerId);
  }

  @Put('profile')
  async updateBusinessProfile(@Request() req, @Body() updateData: UpdateBusinessProfileDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.updateBusinessProfile(providerId, updateData);
  }

  // ========== SERVICE MANAGEMENT ENDPOINTS ==========

  @Get('services')
  async getServices(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.getServices(providerId);
  }

  @Post('services')
  async createService(@Request() req, @Body() createServiceDto: CreateServiceDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.createService(providerId, createServiceDto);
  }

  @Put('services/:serviceId')
  async updateService(
    @Request() req,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.updateService(providerId, serviceId, updateServiceDto);
  }

  @Delete('services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(@Request() req, @Param('serviceId') serviceId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    await this.businessService.deleteService(providerId, serviceId);
  }

  @Get('services/performance')
  async getServicePerformance(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.getServicePerformance(providerId);
  }

  // ========== AVAILABILITY MANAGEMENT ENDPOINTS ==========

  @Get('availability')
  async getAvailability(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.getAvailability(providerId);
  }

  @Put('availability')
  async setAvailability(@Request() req, @Body() setAvailabilityDto: SetAvailabilityDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.setAvailability(providerId, setAvailabilityDto);
  }

  @Get('blocked-times')
  async getBlockedTimes(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.getBlockedTimes(providerId, startDate, endDate);
  }

  @Post('blocked-times')
  async blockTime(@Request() req, @Body() blockTimeDto: BlockTimeDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.blockTime(providerId, blockTimeDto);
  }

  @Delete('blocked-times/:blockedTimeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockTime(@Request() req, @Param('blockedTimeId') blockedTimeId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    await this.businessService.unblockTime(providerId, blockedTimeId);
  }

  // ========== BOOKING MANAGEMENT ENDPOINTS ==========

  @Get('bookings')
  async getBookings(@Request() req, @Query() query: BookingsQueryDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.getBookings(providerId, query);
  }

  @Get('bookings/today')
  async getTodayBookings(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.getTodayBookings(providerId);
  }

  @Get('bookings/upcoming')
  async getUpcomingBookings(@Request() req, @Query('days') days?: number) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.getUpcomingBookings(providerId, days);
  }

  @Get('bookings/:bookingId')
  async getBookingById(@Request() req, @Param('bookingId') bookingId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.getBookingById(providerId, bookingId);
  }

  @Post('bookings/:bookingId/action')
  async handleBookingAction(
    @Request() req,
    @Param('bookingId') bookingId: string,
    @Body() action: BookingActionDto,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.handleBookingAction(providerId, bookingId, action);
  }

  @Post('bookings/:bookingId/start')
  async startService(@Request() req, @Param('bookingId') bookingId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.startService(providerId, bookingId);
  }

  @Post('bookings/reschedule')
  async requestReschedule(@Request() req, @Body() rescheduleDto: RescheduleRequestDto) {
    const providerId = await this.getProviderId(req.user.sub);
    await this.bookingService.requestReschedule(providerId, rescheduleDto);
    return { message: 'Reschedule request sent to customer' };
  }

  @Get('calendar')
  async getProviderCalendar(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.bookingService.getProviderCalendar(providerId, startDate, endDate);
  }

  // ========== MESSAGING ENDPOINTS ==========

  @Get('conversations')
  async getConversations(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.getConversations(providerId);
  }

  @Post('conversations')
  async createConversation(@Request() req, @Body() createConversationDto: CreateConversationDto) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.createConversation(providerId, createConversationDto);
  }

  @Get('conversations/:conversationId')
  async getConversationById(@Request() req, @Param('conversationId') conversationId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.getConversationById(providerId, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query() query: MessagesQueryDto,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.getMessages(providerId, conversationId, query);
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const providerId = await this.getProviderId(req.user.sub);
    const fullMessageDto = { ...sendMessageDto, conversationId };
    return await this.messagingService.addMessage(providerId, fullMessageDto);
  }

  @Put('conversations/:conversationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markMessagesAsRead(@Request() req, @Param('conversationId') conversationId: string) {
    const providerId = await this.getProviderId(req.user.sub);
    await this.messagingService.markMessagesAsRead(providerId, conversationId);
  }

  @Get('conversations/stats')
  async getConversationStats(@Request() req) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.getConversationStats(providerId);
  }

  @Get('conversations/search')
  async searchConversations(@Request() req, @Query('q') searchTerm: string) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.messagingService.searchConversations(providerId, searchTerm);
  }

  // ========== PORTFOLIO MANAGEMENT ENDPOINTS ==========

  @Post('portfolio/images')
  async uploadPortfolioImage(@Request() req, @Body('imageUrl') imageUrl: string) {
    const providerId = await this.getProviderId(req.user.sub);
    return await this.businessService.uploadPortfolioImage(providerId, imageUrl);
  }

  @Delete('portfolio/images')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePortfolioImage(@Request() req, @Body('imageUrl') imageUrl: string) {
    const providerId = await this.getProviderId(req.user.sub);
    await this.businessService.deletePortfolioImage(providerId, imageUrl);
  }

  // ========== REVIEW MANAGEMENT ENDPOINTS ==========
  // TODO: Implement review response functionality

  // ========== FINANCIAL MANAGEMENT ENDPOINTS ==========
  // TODO: Implement payout request functionality
}
