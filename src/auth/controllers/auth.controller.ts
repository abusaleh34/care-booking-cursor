import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';

import {
  ChangePasswordDto,
  ConfirmEmailVerificationDto,
  ConfirmPasswordResetDto,
  ConfirmPhoneVerificationDto,
  DisableMfaDto,
  EnableMfaDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RequestEmailVerificationDto,
  RequestPasswordResetDto,
  RequestPhoneVerificationDto,
  VerifyMfaSetupDto,
} from '../dto';

import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../interfaces/auth.interface';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken: string },
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    await this.authService.logout(user.id, body.refreshToken, ipAddress, userAgent);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    return this.authService.refreshTokens(refreshTokenDto.refreshToken, ipAddress, userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    await this.authService.changePassword(user.id, changePasswordDto, ipAddress, userAgent);
    return { message: 'Password changed successfully' };
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    await this.authService.requestPasswordReset(dto, ipAddress, userAgent);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Public()
  @Post('confirm-password-reset')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    await this.authService.confirmPasswordReset(dto, ipAddress, userAgent);
    return { message: 'Password reset successfully' };
  }

  @Public()
  @Post('request-email-verification')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    // This would typically find the user by email and send verification
    // For now, we'll just return a success message
    return { message: 'If the email exists, a verification link has been sent' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: ConfirmEmailVerificationDto) {
    const userId = await this.tokenService.verifyEmailVerificationToken(dto.token);
    if (!userId) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user verification status
    return { message: 'Email verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-phone-verification')
  @HttpCode(HttpStatus.OK)
  async requestPhoneVerification(@Body() dto: RequestPhoneVerificationDto) {
    await this.smsService.sendVerificationCode(dto.phone);
    return { message: 'Verification code sent to your phone' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-phone')
  @HttpCode(HttpStatus.OK)
  async verifyPhone(@Body() dto: ConfirmPhoneVerificationDto) {
    const isValid = await this.smsService.verifyCode(dto.phone, dto.code);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    return { message: 'Phone verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  async enableMfa(@Body() dto: EnableMfaDto, @CurrentUser() user: any) {
    // Verify password first
    const mfaData = await this.tokenService.generateMfaSecret(user.id);

    return {
      message: 'MFA setup initiated',
      secret: mfaData.secret,
      qrCodeUrl: mfaData.qrCodeUrl,
      backupCodes: mfaData.backupCodes,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify-setup')
  @HttpCode(HttpStatus.OK)
  async verifyMfaSetup(@Body() dto: VerifyMfaSetupDto, @CurrentUser() user: any) {
    const isValid = await this.tokenService.verifyMfaSetup(user.id, dto.code);
    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    return { message: 'MFA enabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  async disableMfa(@Body() dto: DisableMfaDto, @CurrentUser() user: any) {
    // Verify password and MFA code/backup code
    await this.tokenService.removeMfaSecret(user.id);

    return { message: 'MFA disabled successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/backup-codes')
  async getBackupCodes(@CurrentUser() user: any) {
    const backupCodes = await this.tokenService.getMfaBackupCodes(user.id);
    return { backupCodes };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/regenerate-backup-codes')
  @HttpCode(HttpStatus.OK)
  async regenerateBackupCodes(@CurrentUser() user: any) {
    const backupCodes = await this.tokenService.regenerateBackupCodes(user.id);
    return { backupCodes };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
