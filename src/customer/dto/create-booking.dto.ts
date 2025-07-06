import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString({}, { message: 'Please provide a valid booking date' })
  bookingDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}

export class GetAvailabilityDto {
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString({}, { message: 'Please provide a valid date' })
  date: string;
}

export class CancelBookingDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Cancellation reason must not exceed 500 characters' })
  reason?: string;
}

export class RescheduleBookingDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsDateString({}, { message: 'Please provide a valid booking date' })
  newBookingDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format (24-hour)',
  })
  newStartTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}

export class PaymentDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string; // Stripe payment method ID

  @IsOptional()
  @IsNumber()
  @Min(0)
  tipAmount?: number = 0;
}
