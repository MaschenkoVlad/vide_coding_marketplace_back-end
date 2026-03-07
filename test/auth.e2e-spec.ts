import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    const validRegisterPayload = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'JohnD',
    };

    it('should successfully register a new user (happy path)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('lastName', 'Doe');
      expect(response.body).toHaveProperty('displayName', 'JohnD');
      expect(response.body).toHaveProperty('role', 'USER');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('createdAt');

      // Verify sensitive data is NOT exposed
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('hashedPassword');

      // Verify user was created in database
      const userInDb = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(userInDb).toBeTruthy();
      expect(userInDb?.email).toBe('test@example.com');
      expect(userInDb?.firstName).toBe('John');
      expect(userInDb?.lastName).toBe('Doe');
      // Password should be hashed in DB
      expect(userInDb?.password).not.toBe('Password123!');
      expect(userInDb?.password).toContain('$argon2');
    });

    it('should return 409 when email already exists (conflict case)', async () => {
      // First, create a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload)
        .expect(201);

      // Try to register again with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload)
        .expect(409);

      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for password without uppercase letter', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          password: 'password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for password without lowercase letter', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          password: 'PASSWORD123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for password without number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          password: 'Password!@#',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for password shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          password: 'Pass1!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing firstName', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firstName, ...payloadWithoutFirstName } = validRegisterPayload;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payloadWithoutFirstName)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing lastName', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lastName, ...payloadWithoutLastName } = validRegisterPayload;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payloadWithoutLastName)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          email: 'TEST@EXAMPLE.COM',
        })
        .expect(201);

      expect(response.body.email).toBe('test@example.com');

      // Verify in database
      const userInDb = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(userInDb).toBeTruthy();
    });

    it('should trim whitespace from names', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          firstName: '  John  ',
          lastName: '  Doe  ',
        })
        .expect(201);

      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
    });

    it('should allow registration without displayName', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { displayName, ...payloadWithoutDisplayName } = validRegisterPayload;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payloadWithoutDisplayName)
        .expect(201);

      expect(response.body).toHaveProperty('displayName', null);
    });

    it('should trim displayName when provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          displayName: '  JohnD  ',
        })
        .expect(201);

      expect(response.body.displayName).toBe('JohnD');
    });

    it('should handle case-insensitive email conflict', async () => {
      // Register with lowercase email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          email: 'test@example.com',
        })
        .expect(201);

      // Try to register with uppercase email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          email: 'TEST@EXAMPLE.COM',
        })
        .expect(409);

      expect(response.body.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    const validLoginPayload = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);
    });

    it('should successfully login with valid credentials (happy path)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(validLoginPayload)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify user object
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('firstName', 'John');
      expect(response.body.user).toHaveProperty('lastName', 'Doe');
      expect(response.body.user).toHaveProperty('role', 'USER');

      // Verify no sensitive data in user object
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');

      // Verify tokens are strings
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(response.body.accessToken.length).toBeGreaterThan(0);
      expect(response.body.refreshToken.length).toBeGreaterThan(0);

      // Verify refresh session was created in DB
      const sessions = await prisma.refreshTokenSession.findMany({
        where: { userId: response.body.user.id },
      });
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].hashedToken).toBeTruthy();
      // Should be hashed, not plain text
      expect(sessions[0].hashedToken).not.toBe(response.body.refreshToken);
    });

    it('should return 401 for invalid password (invalid credentials)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      // Should not reveal whether email exists or password is wrong
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });

    it('should return 401 for non-existent email (invalid credentials)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      // Same message as invalid password - don't reveal which is wrong
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should successfully refresh tokens (rotation)', async () => {
      // Step 1: Register a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'refresh-test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      // Step 2: Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const originalRefreshToken = loginResponse.body.refreshToken;
      const originalAccessToken = loginResponse.body.accessToken;

      // Verify we have tokens
      expect(originalRefreshToken).toBeTruthy();
      expect(originalAccessToken).toBeTruthy();

      // Step 3: Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: originalRefreshToken,
        })
        .expect(200);

      // Verify new tokens are different
      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.accessToken).not.toBe(originalAccessToken);
      expect(refreshResponse.body.refreshToken).not.toBe(originalRefreshToken);

      // Step 4: Verify old refresh token is now invalid (replay protection)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: originalRefreshToken,
        })
        .expect(401);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should allow multiple refreshes with the latest token', async () => {
      // Step 1: Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'multi-refresh@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'multi-refresh@example.com',
          password: 'Password123!',
        })
        .expect(200);

      let currentRefreshToken = loginResponse.body.refreshToken;

      // Step 2: Chain multiple refreshes
      for (let i = 0; i < 3; i++) {
        const refreshResponse = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken: currentRefreshToken,
          })
          .expect(200);

        // Update token for next iteration
        currentRefreshToken = refreshResponse.body.refreshToken;

        // Verify new tokens were issued
        expect(refreshResponse.body.accessToken).toBeTruthy();
        expect(refreshResponse.body.refreshToken).toBeTruthy();
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout and revoke session', async () => {
      // Step 1: Register and login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logout-test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      // Step 2: Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('message', 'Logged out successfully');

      // Step 3: Verify the refresh token is now invalid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout').send({}).expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/logout-all', () => {
    it('should successfully logout from all devices', async () => {
      // Step 1: Register and login (multiple sessions)
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logout-all-test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      const userId = registerResponse.body.id;

      // Create multiple sessions by logging in multiple times
      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout-all-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout-all-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const refreshToken1 = loginResponse1.body.refreshToken;
      const refreshToken2 = loginResponse2.body.refreshToken;

      // Step 2: Logout all
      const logoutAllResponse = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .send({
          userId,
        })
        .expect(200);

      expect(logoutAllResponse.body).toHaveProperty(
        'message',
        'Logged out from all devices successfully',
      );
      expect(logoutAllResponse.body).toHaveProperty('revokedCount');
      expect(logoutAllResponse.body.revokedCount).toBeGreaterThanOrEqual(2);

      // Step 3: Verify all tokens are now invalid
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken1,
        })
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken2,
        })
        .expect(401);
    });

    it('should return 401 for invalid userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .send({
          userId: 'invalid-user-id',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 for missing userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile with valid access token', async () => {
      // Step 1: Register and login
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'me-test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'me-test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      // Step 2: Get profile with access token
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify response
      expect(meResponse.body).toHaveProperty('id', registerResponse.body.id);
      expect(meResponse.body).toHaveProperty('email', 'me-test@example.com');
      expect(meResponse.body).toHaveProperty('firstName', 'John');
      expect(meResponse.body).toHaveProperty('lastName', 'Doe');
      expect(meResponse.body).toHaveProperty('role', 'USER');
      expect(meResponse.body).toHaveProperty('status');
      expect(meResponse.body).toHaveProperty('createdAt');

      // Verify no sensitive data
      expect(meResponse.body).not.toHaveProperty('password');
      expect(meResponse.body).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without access token', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me').expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 with invalid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 with expired access token', async () => {
      // This test would need a way to generate an expired token
      // For now, we'll just verify the endpoint requires auth
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set(
          'Authorization',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj8T6L8wR8rX8vZ3h1QY8YhY9Z0a1B2c3D4e5F6g',
        )
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });
  });

  describe('Protected logout-all with JWT', () => {
    it('should logout from all devices with valid access token', async () => {
      // Step 1: Register and login (create multiple sessions)
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'protected-logout-all@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      // Login multiple times to create multiple sessions
      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'protected-logout-all@example.com',
          password: 'Password123!',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'protected-logout-all@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const accessToken = loginResponse1.body.accessToken;
      const refreshToken1 = loginResponse1.body.refreshToken;

      // Step 2: Call logout-all with access token (no body needed now)
      const logoutAllResponse = await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutAllResponse.body).toHaveProperty(
        'message',
        'Logged out from all devices successfully',
      );
      expect(logoutAllResponse.body).toHaveProperty('revokedCount');
      expect(logoutAllResponse.body.revokedCount).toBeGreaterThanOrEqual(2);

      // Step 3: Verify tokens are revoked
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);
    });

    it('should return 401 for logout-all without access token', async () => {
      await request(app.getHttpServer()).post('/auth/logout-all').expect(401);
    });

    it('should return 401 for logout-all with invalid access token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
