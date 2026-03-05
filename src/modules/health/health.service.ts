import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus.status === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<{ status: string; responseTime: string; error?: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: `${Date.now() - start}ms`,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: `${Date.now() - start}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
