import { Controller, Post, Get, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import type { TokenResponseDto, UserProfileDto } from '../dto/auth.dto';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async register(@Body() _dto: RegisterDto): Promise<TokenResponseDto> {
    // TODO: Implement registration endpoint
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Registration endpoint - not yet implemented',
        error: 'Not Implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async login(@Body() _dto: LoginDto): Promise<TokenResponseDto> {
    // TODO: Implement login endpoint
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Login endpoint - not yet implemented',
        error: 'Not Implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async refresh(@Body() _dto: RefreshTokenDto): Promise<TokenResponseDto> {
    // TODO: Implement refresh token endpoint
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Token refresh endpoint - not yet implemented',
        error: 'Not Implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async logout(@Body() _dto: RefreshTokenDto): Promise<{ message: string }> {
    // TODO: Implement logout endpoint
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Logout endpoint - not yet implemented',
        error: 'Not Implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async getProfile(): Promise<UserProfileDto> {
    // TODO: Implement get current user profile endpoint
    // Requires JWT authentication guard
    throw new HttpException(
      {
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        message: 'Get profile endpoint - not yet implemented',
        error: 'Not Implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
