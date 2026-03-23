import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';
import { UserService } from '../../users/application/user.service';
import { UserRole } from '../../users/domain/user.types';
import type { User, UserStatus } from '../../users/domain/user.types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: jest.Mocked<UserService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.BUYER,
    status: 'ACTIVE' as UserStatus,
    avatar: null,
    bio: null,
    phone: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPayload: JwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'BUYER',
    status: 'ACTIVE',
    iat: 1704067200,
    exp: 1704070800,
  };

  beforeEach(async () => {
    const mockUserService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if JWT secret is not configured', async () => {
      const mockConfigWithoutSecret = {
        get: jest.fn().mockReturnValue(undefined),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: UserService,
              useValue: { findById: jest.fn() },
            },
            {
              provide: ConfigService,
              useValue: mockConfigWithoutSecret,
            },
          ],
        }).compile(),
      ).rejects.toThrow();
    });
  });

  describe('validate', () => {
    it('should return authenticated user data for valid payload and active user', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'BUYER',
        status: 'ACTIVE',
      });
      expect(userService.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not ACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: 'SUSPENDED' as UserStatus };
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is PENDING_VERIFICATION', async () => {
      const pendingUser = { ...mockUser, status: 'PENDING_VERIFICATION' as UserStatus };
      userService.findById.mockResolvedValue(pendingUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is INACTIVE', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' as UserStatus };
      userService.findById.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
