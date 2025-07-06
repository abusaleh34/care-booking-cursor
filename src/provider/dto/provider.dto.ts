import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MessageType } from '../../database/entities/message.entity';

// Time validation pattern for HH:MM format
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Business Profile DTOs
export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  businessName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  businessDescription?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  businessAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  businessPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  businessEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioImages?: string[];
}

// Availability Management DTOs
export class AvailabilitySlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.

  @IsString()
  @Matches(TIME_PATTERN, { message: 'Start time must be in HH:MM format' })
  startTime: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'End time must be in HH:MM format' })
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];
}

export class BlockTimeDto {
  @IsDateString()
  blockedDate: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Start time must be in HH:MM format' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'End time must be in HH:MM format' })
  endTime?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}

// Booking Management DTOs
export class BookingActionDto {
  @IsEnum(['accept', 'decline', 'complete'])
  action: 'accept' | 'decline' | 'complete';

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

export class RescheduleRequestDto {
  @IsUUID()
  bookingId: string;

  @IsDateString()
  newDate: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'New start time must be in HH:MM format' })
  newStartTime: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

// Messaging DTOs
export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  @Length(1, 1000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsOptional()
  @IsUrl()
  fileUrl?: string;
}

export class CreateConversationDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsString()
  @Length(1, 1000)
  initialMessage: string;
}

// Review Management DTOs
export class RespondToReviewDto {
  @IsUUID()
  reviewId: string;

  @IsString()
  @Length(1, 500)
  response: string;
}

// Financial DTOs
export class PayoutRequestDto {
  @IsNumber()
  @Min(10)
  amount: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  payoutMethod?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  notes?: string;
}

export class EarningsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly';

  @IsOptional()
  @IsString()
  serviceId?: string;
}

// Analytics DTOs
export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['bookings', 'revenue', 'ratings', 'customers'])
  metric?: 'bookings' | 'revenue' | 'ratings' | 'customers';
}

// Service Management DTOs
export class CreateServiceDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsString()
  @Length(1, 1000)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(15)
  duration: number; // in minutes

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(15)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Query DTOs
export class BookingsQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class MessagesQueryDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
