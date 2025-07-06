import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestEmailVerificationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class ConfirmEmailVerificationDto {
  @IsString()
  @MinLength(1, { message: 'Verification token is required' })
  token: string;
}
