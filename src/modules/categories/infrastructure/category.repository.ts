import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { Category, CategoryWithListingsCount } from '../domain/category.types';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  async findWithListingsCount(): Promise<CategoryWithListingsCount[]> {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            listings: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: { slug: string; name: string }): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  async update(id: string, data: { slug?: string; name?: string }): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
