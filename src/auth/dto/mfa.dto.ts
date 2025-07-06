import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EnableMfaDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  password: string;
}

export class VerifyMfaSetupDto {
  @IsString()
  @MinLength(6, { message: 'MFA code must be 6 digits' })
  @MaxLength(6, { message: 'MFA code must be 6 digits' })
  code: string;
}

export class DisableMfaDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'MFA code must be 6 digits' })
  @MaxLength(6, { message: 'MFA code must be 6 digits' })
  mfaCode?: string;

  @IsOptional()
  @IsString()
  backupCode?: string;
}

export class VerifyMfaDto {
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'MFA code must be 6 digits' })
  @MaxLength(6, { message: 'MFA code must be 6 digits' })
  code?: string;

  @IsOptional()
  @IsString()
  backupCode?: string;
}
