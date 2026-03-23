import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  Listing,
  ListingWithRelations,
  CreateListingData,
  UpdateListingData,
  ListingFilters,
  ListingSearchResult,
} from '../domain/listing.types';

@Injectable()
export class ListingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateListingData & { sellerId: string }): Promise<Listing> {
    const result = await this.prisma.listing.create({
      data: {
        ...data,
        status: 'DRAFT',
        attributes: data.attributes || {},
      },
    });

    return this.mapPrismaListingToListing(result);
  }

  async findById(id: string): Promise<Listing | null> {
    const result = await this.prisma.listing.findUnique({
      where: { id },
    });

    return result ? this.mapPrismaListingToListing(result) : null;
  }

  async findByIdWithRelations(id: string): Promise<ListingWithRelations | null> {
    const result = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    return result ? this.mapPrismaListingToListingWithRelations(result) : null;
  }

  async findBySellerId(
    sellerId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ listings: Listing[]; total: number }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { sellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.listing.count({
        where: { sellerId },
      }),
    ]);

    return {
      listings: listings.map((listing) => this.mapPrismaListingToListing(listing)),
      total,
    };
  }

  async findPublished(filters: ListingFilters): Promise<ListingSearchResult> {
    const {
      categoryId,
      condition,
      priceMin,
      priceMax,
      city,
      sort = 'newest',
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Record<string, any> = {
      status: 'PUBLISHED',
    };

    if (categoryId) where.categoryId = categoryId;
    if (condition) where.condition = condition;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = priceMin;
      if (priceMax) where.price.lte = priceMax;
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'newest':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings: listings.map((listing) => this.mapPrismaListingToListingWithRelations(listing)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateListingData): Promise<Listing> {
    const result = await this.prisma.listing.update({
      where: { id },
      data,
    });

    return this.mapPrismaListingToListing(result);
  }

  async updateStatus(id: string, status: string): Promise<Listing> {
    const result = await this.prisma.listing.update({
      where: { id },
      data: { status: status as any },
    });

    return this.mapPrismaListingToListing(result);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.listing.delete({
      where: { id },
    });
  }

  async canUserUpdateListing(id: string, userId: string): Promise<boolean> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    });

    if (!listing) return false;
    if (listing.sellerId !== userId) return false;
    if (listing.status === 'SOLD' || listing.status === 'BLOCKED') return false;

    return true;
  }

  async canUserPublishListing(id: string, userId: string): Promise<boolean> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true, title: true, description: true, price: true },
    });

    if (!listing) return false;
    if (listing.sellerId !== userId) return false;
    if (listing.status !== 'DRAFT') return false;

    // Validate required fields for publishing
    if (!listing.title || !listing.description || !listing.price || listing.price <= 0) {
      return false;
    }

    return true;
  }

  private mapPrismaListingToListing(prismaListing: any): Listing {
    return {
      id: prismaListing.id,
      sellerId: prismaListing.sellerId,
      categoryId: prismaListing.categoryId,
      title: prismaListing.title,
      description: prismaListing.description,
      price: prismaListing.price,
      currency: prismaListing.currency as any,
      condition: prismaListing.condition as any,
      city: prismaListing.city,
      attributes: prismaListing.attributes as Record<string, any>,
      status: prismaListing.status as any,
      createdAt: prismaListing.createdAt,
      updatedAt: prismaListing.updatedAt,
    };
  }

  private mapPrismaListingToListingWithRelations(prismaListing: any): ListingWithRelations {
    return {
      ...this.mapPrismaListingToListing(prismaListing),
      seller: prismaListing.seller,
      category: prismaListing.category,
    };
  }
}
