import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { UserService } from '../../users/application/user.service';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import type { UserResponseDto, LoginResponseDto } from '../dto/auth.dto';
import type { UserRole, UserStatus, User } from '../../users/domain/user.types';
import type { TokenPair, TokenPayload } from '../domain/auth.types';
import { verifyPassword } from '../../../common/utils/password-hash';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: RegisterData): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, displayName } = data;
    const normalizedEmail = email.toLowerCase().trim();

    this.logger.log(`Processing registration for email: ${normalizedEmail}`);

    try {
      const user = await this.userService.create({
        email: normalizedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'USER' as UserRole,
      });

      this.logger.log(`User registered successfully: ${user.id}`);

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: displayName?.trim() || null,
        role: user.role,
        status: user.status as UserStatus,
        createdAt: user.createdAt,
        avatar: user.avatar,
        bio: user.bio,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(`Registration failed - email already exists: ${normalizedEmail}`);
        throw error;
      }
      this.logger.error(`Registration failed for ${normalizedEmail}: ${(error as Error).message}`);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(
    _email: string,
    _password: string,
    _ipAddress?: string,
    _userAgent?: string,
  ): Promise<TokenPair> {
    // TODO: Implement login:
    // 1. Find user by email
    // 2. Verify password
    // 3. Check user status
    // 4. Generate token pair
    // 5. Create refresh token session
    throw new Error('Not implemented');
  }

  async loginUser(data: LoginData): Promise<LoginResponseDto> {
    const { email, password, ipAddress, userAgent } = data;
    const normalizedEmail = email.toLowerCase().trim();

    this.logger.log(`Processing login for email: ${normalizedEmail}`);

    // Find user by email
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password for user: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status - using ForbiddenException for non-active users
    // Rationale: Authentication succeeded (valid credentials) but authorization failed
    // User exists but is not allowed to access the system
    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Login failed - user status is ${user.status}: ${user.id}`);
      throw new ForbiddenException(`Account is ${user.status.toLowerCase().replace('_', ' ')}`);
    }

    // Generate token pair
    const tokens = await this.generateTokenPair(user);

    // Create refresh token session with hashed token
    const refreshTokenHash = this.hashToken(tokens.refreshToken);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date(Date.now() + this.parseDurationToMs(refreshExpiresIn));

    await this.refreshTokenRepository.create({
      tokenFamily: randomBytes(16).toString('hex'),
      hashedToken: refreshTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user: this.mapUserToResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokenPair(user: User): Promise<TokenPair> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(32).toString('hex');

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationToMs(duration: string): number {
    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      case 'w':
        return num * 7 * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  private mapUserToResponse(user: User): UserResponseDto {
    const { id, email, firstName, lastName, role, status, createdAt, avatar, bio } = user;

    return {
      id,
      email,
      firstName,
      lastName,
      displayName: null, // Not stored in user model currently
      role,
      status: status as UserStatus,
      createdAt,
      avatar,
      bio,
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    this.logger.log('Processing token refresh');

    // Hash the provided refresh token for lookup
    const hashedToken = this.hashToken(refreshToken);

    // Find session by hashed token
    const session = await this.refreshTokenRepository.findByHashedToken(hashedToken);
    if (!session) {
      this.logger.warn('Token refresh failed - session not found');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if session is revoked
    if (session.revokedAt) {
      this.logger.warn(`Token refresh failed - session revoked: ${session.id}`);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.logger.warn(`Token refresh failed - session expired: ${session.id}`);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Find user
    const user = await this.userService.findById(session.userId);
    if (!user) {
      this.logger.warn(`Token refresh failed - user not found: ${session.userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Token refresh failed - user not active: ${user.id} (${user.status})`);
      throw new ForbiddenException(`Account is ${user.status.toLowerCase().replace('_', ' ')}`);
    }

    // Revoke the old session (rotation - prevents replay attacks)
    await this.refreshTokenRepository.revoke(session.id);
    this.logger.log(`Revoked old refresh session: ${session.id}`);

    // Generate new token pair
    const tokens = await this.generateTokenPair(user);

    // Create new refresh token session with same family (for tracking)
    const newRefreshTokenHash = this.hashToken(tokens.refreshToken);
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date(Date.now() + this.parseDurationToMs(refreshExpiresIn));

    await this.refreshTokenRepository.create({
      tokenFamily: session.tokenFamily, // Same family for tracking
      hashedToken: newRefreshTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
      userId: user.id,
    });

    this.logger.log(`Token refresh successful for user: ${user.id}`);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.log('Processing logout');

    // Hash the provided refresh token
    const hashedToken = this.hashToken(refreshToken);

    // Find session by hashed token
    const session = await this.refreshTokenRepository.findByHashedToken(hashedToken);
    if (!session) {
      this.logger.warn('Logout failed - session not found');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if session is already revoked
    if (session.revokedAt) {
      this.logger.log(`Session already revoked: ${session.id}`);
      return;
    }

    // Revoke the session
    await this.refreshTokenRepository.revoke(session.id);
    this.logger.log(`User logged out successfully, session revoked: ${session.id}`);
  }

  async logoutAll(userId: string): Promise<{ revokedCount: number }> {
    this.logger.log(`Processing logout-all for user: ${userId}`);

    // Verify user exists
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn(`Logout-all failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    // Revoke all active sessions
    const revokedCount = await this.refreshTokenRepository.revokeAllForUser(userId);
    this.logger.log(`Logout-all successful for user ${userId}, revoked ${revokedCount} sessions`);

    return { revokedCount };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching profile for user: ${userId}`);

    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn(`Profile fetch failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToResponse(user);
  }

  // Private helper methods (to be implemented):
  // private generateTokenPair(payload: TokenPayload): TokenPair {}
  // private generateAccessToken(payload: TokenPayload): string {}
  // private generateRefreshToken(): string {}
  // private hashToken(token: string): string {}
}
