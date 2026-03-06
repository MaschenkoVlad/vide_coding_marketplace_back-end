export interface TokenPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenSession {
  id: string;
  tokenFamily: string;
  hashedToken: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface CreateRefreshTokenSessionData {
  tokenFamily: string;
  hashedToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}
