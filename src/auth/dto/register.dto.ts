import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number (E.164 format)',
  })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(100, { message: 'First name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Last name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: 'Gender must be one of: male, female, other, prefer_not_to_say',
  })
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone must not exceed 50 characters' })
  timezone?: string;

  @IsOptional()
  @IsEnum(['en', 'es', 'fr', 'de', 'ar'], {
    message: 'Language preference must be one of: en, es, fr, de, ar',
  })
  languagePreference?: string;
}
