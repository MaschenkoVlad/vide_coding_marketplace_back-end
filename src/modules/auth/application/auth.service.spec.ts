import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../../users/application/user.service';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import type { UserRole, UserStatus } from '../../users/domain/user.types';

// Mock argon2 to avoid actual hashing in tests
jest.mock('../../../common/utils/password-hash', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password_123'),
  verifyPassword: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'BUYER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    password: 'hashed_password_123',
    avatar: null,
    bio: null,
    phone: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockUserService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      create: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    refreshTokenRepository = module.get(
      RefreshTokenRepository,
    ) as jest.Mocked<RefreshTokenRepository>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnD',
    };

    it('should successfully register a new user', async () => {
      userService.create.mockResolvedValue(mockUser);

      const result = await service.register(validRegisterData);

      expect(userService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'BUYER',
      });

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'JohnD',
        role: 'BUYER',
        status: 'PENDING_VERIFICATION',
        createdAt: mockUser.createdAt,
        avatar: null,
        bio: null,
      });

      // Verify password hash is NOT in the response
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should normalize email to lowercase', async () => {
      userService.create.mockResolvedValue(mockUser);

      await service.register({
        ...validRegisterData,
        email: 'TEST@EXAMPLE.COM',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      );
    });

    it('should trim whitespace from email', async () => {
      userService.create.mockResolvedValue(mockUser);

      await service.register({
        ...validRegisterData,
        email: '  test@example.com  ',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      );
    });

    it('should trim whitespace from firstName and lastName', async () => {
      userService.create.mockResolvedValue(mockUser);

      await service.register({
        ...validRegisterData,
        firstName: '  John  ',
        lastName: '  Doe  ',
      });

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
    });

    it('should handle missing displayName', async () => {
      userService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.displayName).toBeNull();
    });

    it('should propagate ConflictException when email already exists', async () => {
      userService.create.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(service.register(validRegisterData)).rejects.toThrow(ConflictException);

      expect(userService.create).toHaveBeenCalled();
    });

    it('should assign BUYER role by default', async () => {
      userService.create.mockResolvedValue(mockUser);

      await service.register(validRegisterData);

      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'BUYER',
        }),
      );
    });

    it('should not include password in the response', async () => {
      userService.create.mockResolvedValue(mockUser);

      const result = await service.register(validRegisterData);

      // Verify no password-related fields are in the response
      const resultKeys = Object.keys(result);
      expect(resultKeys).not.toContain('password');
      expect(resultKeys).not.toContain('passwordHash');
      expect(resultKeys).not.toContain('hashedPassword');
    });

    it('should log registration attempt', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      userService.create.mockResolvedValue(mockUser);

      await service.register(validRegisterData);

      expect(loggerSpy).toHaveBeenCalledWith('Processing registration for email: test@example.com');
      expect(loggerSpy).toHaveBeenCalledWith('User registered successfully: user-123');
    });

    it('should log warning when email already exists', async () => {
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      userService.create.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(service.register(validRegisterData)).rejects.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(
        'Registration failed - email already exists: test@example.com',
      );
    });
  });

  describe('loginUser', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Password123!',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    const { verifyPassword } = jest.requireMock('../../../common/utils/password-hash');

    beforeEach(() => {
      verifyPassword.mockReset();
    });

    it('should successfully login with valid credentials', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-123',
        tokenFamily: 'family-123',
        hashedToken: 'hashed-refresh',
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });

      const result = await service.loginUser(validLoginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id', mockUser.id);
      expect(result.user).toHaveProperty('email', mockUser.email);

      // Verify tokens are not exposed in user object
      expect(result.user).not.toHaveProperty('password');

      // Verify refresh session was created
      expect(refreshTokenRepository.create).toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.loginUser(validLoginData)).rejects.toThrow(UnauthorizedException);
    });

    it('should return 401 when password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(false);

      await expect(service.loginUser(validLoginData)).rejects.toThrow(UnauthorizedException);
    });

    it('should return 403 when user is not ACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: 'SUSPENDED' as UserStatus };
      userService.findByEmail.mockResolvedValue(inactiveUser);
      verifyPassword.mockResolvedValue(true);

      await expect(service.loginUser(validLoginData)).rejects.toThrow(ForbiddenException);
    });

    it('should normalize email to lowercase', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-123',
        tokenFamily: 'family-123',
        hashedToken: 'hashed-refresh',
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: null,
        userAgent: null,
        userId: mockUser.id,
      });

      await service.loginUser({
        ...validLoginData,
        email: 'TEST@EXAMPLE.COM',
      });

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should log login success', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      userService.findByEmail.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-123',
        tokenFamily: 'family-123',
        hashedToken: 'hashed-refresh',
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: null,
        userAgent: null,
        userId: mockUser.id,
      });

      await service.loginUser(validLoginData);

      expect(logSpy).toHaveBeenCalledWith('Processing login for email: test@example.com');
      expect(logSpy).toHaveBeenCalledWith('User logged in successfully: user-123');
    });

    it('should log login failure for invalid credentials', async () => {
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.loginUser(validLoginData)).rejects.toThrow();

      expect(warnSpy).toHaveBeenCalledWith('Login failed - user not found: test@example.com');
    });

    it('should create refresh session with hashed token', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      verifyPassword.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-123',
        tokenFamily: 'family-123',
        hashedToken: 'hashed-refresh',
        expiresAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });

      await service.loginUser(validLoginData);

      const createCall = refreshTokenRepository.create.mock.calls[0][0];
      expect(createCall.hashedToken).toBeTruthy();
      expect(createCall.hashedToken).not.toContain('plain');
      expect(createCall.tokenFamily).toBeTruthy();
    });
  });

  describe('refreshTokens', () => {
    const mockSession = {
      id: 'session-123',
      tokenFamily: 'family-abc',
      hashedToken: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // hash of 'password'
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      revokedAt: null,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      userId: 'user-123',
    };

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Setup mocks
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-456',
        tokenFamily: mockSession.tokenFamily,
        hashedToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });

      const result = await service.refreshTokens('valid-refresh-token');

      // Verify result
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe('valid-refresh-token');

      // Verify old session was revoked
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(mockSession.id);

      // Verify new session was created with same family
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenFamily: mockSession.tokenFamily,
          userId: mockUser.id,
        }),
      );
    });

    it('should return 401 when refresh token is not found', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return 401 when session is revoked', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(),
      });

      await expect(service.refreshTokens('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return 401 when session is expired', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return 401 when user not found', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return 403 when user is not ACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: 'SUSPENDED' as UserStatus };
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(ForbiddenException);
    });

    it('should prevent replay attack - old token becomes invalid after refresh', async () => {
      // First refresh
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-456',
        tokenFamily: mockSession.tokenFamily,
        hashedToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });

      const firstResult = await service.refreshTokens('original-token');
      expect(firstResult).toHaveProperty('accessToken');
      expect(firstResult).toHaveProperty('refreshToken');

      // After first refresh, session should be revoked
      // If someone tries to use the original token again
      refreshTokenRepository.findByHashedToken.mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(), // Now revoked
      });

      // Second refresh with same token should fail
      await expect(service.refreshTokens('original-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should log refresh success', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });
      refreshTokenRepository.create.mockResolvedValue({
        id: 'session-456',
        tokenFamily: mockSession.tokenFamily,
        hashedToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });

      await service.refreshTokens('valid-token');

      expect(logSpy).toHaveBeenCalledWith('Processing token refresh');
      expect(logSpy).toHaveBeenCalledWith('Token refresh successful for user: user-123');
    });

    it('should preserve token family across rotations', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });

      const createMock = jest.fn().mockResolvedValue({
        id: 'session-456',
        tokenFamily: mockSession.tokenFamily,
        hashedToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        userId: mockUser.id,
      });
      refreshTokenRepository.create = createMock;

      await service.refreshTokens('valid-token');

      // Verify same token family is preserved
      const createCall = createMock.mock.calls[0][0];
      expect(createCall.tokenFamily).toBe(mockSession.tokenFamily);
    });
  });

  describe('logout', () => {
    const mockSession = {
      id: 'session-123',
      tokenFamily: 'family-abc',
      hashedToken: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      revokedAt: null,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      userId: 'user-123',
    };

    it('should successfully logout and revoke session', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });

      await service.logout('valid-refresh-token');

      expect(refreshTokenRepository.findByHashedToken).toHaveBeenCalled();
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(mockSession.id);
    });

    it('should return 401 when refresh token not found', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should succeed silently when session already revoked', async () => {
      refreshTokenRepository.findByHashedToken.mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(),
      });

      await service.logout('already-revoked-token');

      // Should not try to revoke again
      expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
    });

    it('should log logout success', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      refreshTokenRepository.findByHashedToken.mockResolvedValue(mockSession);
      refreshTokenRepository.revoke.mockResolvedValue({ ...mockSession, revokedAt: new Date() });

      await service.logout('valid-token');

      expect(logSpy).toHaveBeenCalledWith('Processing logout');
      expect(logSpy).toHaveBeenCalledWith(
        `User logged out successfully, session revoked: ${mockSession.id}`,
      );
    });
  });

  describe('logoutAll', () => {
    it('should successfully revoke all sessions for user', async () => {
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revokeAllForUser.mockResolvedValue(3);

      const result = await service.logoutAll('user-123');

      expect(userService.findById).toHaveBeenCalledWith('user-123');
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ revokedCount: 3 });
    });

    it('should return 401 when user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.logoutAll('invalid-user-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should handle zero active sessions', async () => {
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revokeAllForUser.mockResolvedValue(0);

      const result = await service.logoutAll('user-123');

      expect(result).toEqual({ revokedCount: 0 });
    });

    it('should log logout-all success', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      userService.findById.mockResolvedValue(mockUser);
      refreshTokenRepository.revokeAllForUser.mockResolvedValue(5);

      await service.logoutAll('user-123');

      expect(logSpy).toHaveBeenCalledWith('Processing logout-all for user: user-123');
      expect(logSpy).toHaveBeenCalledWith(
        'Logout-all successful for user user-123, revoked 5 sessions',
      );
    });
  });
});
