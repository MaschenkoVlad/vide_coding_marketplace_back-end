import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { RefreshTokenSession, CreateRefreshTokenSessionData } from '../domain/auth.types';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RefreshTokenSession | null> {
    const session = await this.prisma.refreshTokenSession.findUnique({
      where: { id },
    });
    return session as RefreshTokenSession | null;
  }

  async findByHashedToken(hashedToken: string): Promise<RefreshTokenSession | null> {
    const session = await this.prisma.refreshTokenSession.findFirst({
      where: { hashedToken },
    });
    return session as RefreshTokenSession | null;
  }

  async findByTokenFamily(tokenFamily: string): Promise<RefreshTokenSession[]> {
    const sessions = await this.prisma.refreshTokenSession.findMany({
      where: { tokenFamily },
      orderBy: { createdAt: 'desc' },
    });
    return sessions as RefreshTokenSession[];
  }

  async create(data: CreateRefreshTokenSessionData): Promise<RefreshTokenSession> {
    const session = await this.prisma.refreshTokenSession.create({ data });
    return session as RefreshTokenSession;
  }

  async revoke(id: string): Promise<RefreshTokenSession> {
    const session = await this.prisma.refreshTokenSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return session as RefreshTokenSession;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.refreshTokenSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  // TODO: Add cleanup method for expired sessions
  // async deleteExpired(beforeDate: Date): Promise<number> {}
}
