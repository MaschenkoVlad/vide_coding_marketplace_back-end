import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { User, CreateUserData, UpdateUserData } from '../domain/user.types';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user as User | null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
      },
    });
    return user as User;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return user as User;
  }

  // TODO: Implement additional query methods as needed
  // async findByStatus(status: UserStatus): Promise<User[]> {}
  // async findByRole(role: UserRole): Promise<User[]> {}
  // async softDelete(id: string): Promise<void> {}
}
