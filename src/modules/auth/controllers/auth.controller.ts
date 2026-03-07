import { Controller, Post, Get, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService, type RegisterData, type LoginData } from '../application/auth.service';
import type {
  UserResponseDto,
  UserProfileDto,
  TokenResponseDto,
  LoginResponseDto,
} from '../dto/auth.dto';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, displayName } = dto;
    const registerData: RegisterData = {
      email,
      password,
      firstName,
      lastName,
      displayName,
    };

    return this.authService.register(registerData);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    const { email, password } = dto;
    const { ip, headers } = req;

    const loginData: LoginData = {
      email,
      password,
      ipAddress: ip || undefined,
      userAgent: headers['user-agent'] || undefined,
    };

    return this.authService.loginUser(loginData);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<TokenResponseDto> {
    const { refreshToken } = dto;
    const { ip, headers } = req;

    return this.authService.refreshTokens(
      refreshToken,
      ip || undefined,
      headers['user-agent'] || undefined,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<{ message: string; revokedCount: number }> {
    const result = await this.authService.logoutAll(req.user.userId);
    return {
      message: 'Logged out from all devices successfully',
      revokedCount: result.revokedCount,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: Request & { user: AuthenticatedUser }): Promise<UserProfileDto> {
    const user = await this.authService.getProfile(req.user.userId);
    return user;
  }
}
