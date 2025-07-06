import { IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestPhoneVerificationDto {
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone: string;
}

export class ConfirmPhoneVerificationDto {
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  phone: string;

  @IsString()
  @MinLength(4, { message: 'Verification code must be at least 4 characters' })
  @MaxLength(10, { message: 'Verification code must not exceed 10 characters' })
  code: string;
}
