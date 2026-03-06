// ============================================
// Auth Constants
// ============================================

export const AUTH_CONSTANTS = {
  // Token expiration times (in seconds)
  ACCESS_TOKEN_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days

  // Token lengths
  REFRESH_TOKEN_LENGTH: 64,

  // Cookie names
  ACCESS_TOKEN_COOKIE: 'access_token',
  REFRESH_TOKEN_COOKIE: 'refresh_token',

  // Headers
  AUTHORIZATION_HEADER: 'authorization',
  BEARER_PREFIX: 'Bearer ',
} as const;

// ============================================
// Token Types
// ============================================

export type TokenType = 'access' | 'refresh';

// ============================================
// Request Types
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
