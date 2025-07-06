import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/auth')
export class MockAuthController {
  // In-memory storage for demo purposes
  private users: any[] = [];

  @Public()
  @Post('register')
  async register(@Body() registerDto: any, @Res() res: Response) {
    try {
      const { email, password, firstName, lastName, phone } = registerDto;

      // Basic validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: 400,
          message: 'Missing required fields: email, password, firstName, lastName',
        });
      }

      // Check if user already exists
      const existingUser = this.users.find((user) => user.email === email);
      if (existingUser) {
        return res.status(HttpStatus.CONFLICT).json({
          statusCode: 409,
          message: 'User with this email already exists',
        });
      }

      // Create mock user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        phone: phone || null,
        isVerified: true,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };

      // Store user
      this.users.push(newUser);

      // Generate mock tokens
      const accessToken = `mock_access_token_${newUser.id}_${Date.now()}`;
      const refreshToken = `mock_refresh_token_${newUser.id}_${Date.now()}`;

      // Return success response
      return res.status(HttpStatus.CREATED).json({
        statusCode: 201,
        message: 'User registered successfully',
        accessToken,
        refreshToken,
        expiresIn: 86400, // 24 hours
        user: {
          id: newUser.id,
          email: newUser.email,
          isVerified: newUser.isVerified,
          mfaEnabled: newUser.mfaEnabled,
          profile: {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            avatarUrl: null,
          },
          roles: ['customer'],
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: 'Registration failed',
        error: error.message,
      });
    }
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: any, @Res() res: Response) {
    try {
      const { email, password } = loginDto;

      // Basic validation
      if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: 400,
          message: 'Email and password are required',
        });
      }

      // Find user
      const user = this.users.find((u) => u.email === email);
      if (!user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: 401,
          message: 'Invalid credentials',
        });
      }

      // For demo purposes, accept any password
      // In real implementation, you'd verify the password hash

      // Generate mock tokens
      const accessToken = `mock_access_token_${user.id}_${Date.now()}`;
      const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Login successful',
        accessToken,
        refreshToken,
        expiresIn: 86400,
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
          mfaEnabled: user.mfaEnabled,
          profile: {
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: null,
          },
          roles: ['customer'],
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  @Public()
  @Post('demo-reset')
  async demoReset(@Res() res: Response) {
    // Clear all users for demo purposes
    this.users = [];
    return res.status(HttpStatus.OK).json({
      statusCode: 200,
      message: 'Demo data reset successfully',
      usersCount: 0,
    });
  }
}
