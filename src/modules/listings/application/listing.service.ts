import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ListingRepository } from '../infrastructure/listing.repository';
import type {
  Listing,
  ListingWithRelations,
  CreateListingData,
  UpdateListingData,
  ListingFilters,
  ListingSearchResult,
} from '../domain/listing.types';

@Injectable()
export class ListingService {
  constructor(private readonly listingRepository: ListingRepository) {}

  async createListing(sellerId: string, data: CreateListingData): Promise<Listing> {
    // Validate attributes
    if (data.attributes && !this.validateAttributes(data.attributes)) {
      throw new BadRequestException('Invalid attributes format');
    }

    return this.listingRepository.create({ ...data, sellerId });
  }

  async getListingById(id: string): Promise<Listing | null> {
    return this.listingRepository.findById(id);
  }

  async getListingByIdWithRelations(id: string): Promise<ListingWithRelations | null> {
    return this.listingRepository.findByIdWithRelations(id);
  }

  async getSellerListings(
    sellerId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ listings: Listing[]; total: number }> {
    return this.listingRepository.findBySellerId(sellerId, options);
  }

  async getPublishedListings(filters: ListingFilters): Promise<ListingSearchResult> {
    return this.listingRepository.findPublished(filters);
  }

  async updateListing(id: string, userId: string, data: UpdateListingData): Promise<Listing> {
    // Check if user can update this listing
    const canUpdate = await this.listingRepository.canUserUpdateListing(id, userId);
    if (!canUpdate) {
      throw new ForbiddenException('Cannot update this listing');
    }

    // Validate attributes if provided
    if (data.attributes && !this.validateAttributes(data.attributes)) {
      throw new BadRequestException('Invalid attributes format');
    }

    return this.listingRepository.update(id, data);
  }

  async publishListing(id: string, userId: string): Promise<Listing> {
    // Check if user can publish this listing
    const canPublish = await this.listingRepository.canUserPublishListing(id, userId);
    if (!canPublish) {
      const listing = await this.listingRepository.findById(id);
      if (listing) {
        throw new ConflictException(
          'Listing cannot be published (invalid status or missing required fields)',
        );
      } else {
        throw new NotFoundException('Listing not found');
      }
    }

    return this.listingRepository.updateStatus(id, 'PUBLISHED');
  }

  async archiveListing(id: string, userId: string): Promise<Listing> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('Cannot archive this listing');
    }

    if (listing.status === 'SOLD' || listing.status === 'BLOCKED') {
      throw new ConflictException('Cannot archive listing with current status');
    }

    return this.listingRepository.updateStatus(id, 'ARCHIVED');
  }

  async deleteListing(id: string, userId: string): Promise<void> {
    const listing = await this.listingRepository.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('Cannot delete this listing');
    }

    // Only allow deletion of draft listings
    if (listing.status !== 'DRAFT') {
      throw new ConflictException('Can only delete draft listings');
    }

    await this.listingRepository.delete(id);
  }

  private validateAttributes(attributes: Record<string, any>): boolean {
    // Basic validation for attributes
    try {
      const json = JSON.stringify(attributes);

      // Check size (prevent storing megabytes of data)
      if (json.length > 10000) {
        // 10KB limit
        return false;
      }

      // Check depth (prevent deeply nested objects)
      const depth = this.getObjectDepth(attributes);
      if (depth > 5) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private getObjectDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    if (currentDepth > 5) {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    for (const value of Object.values(obj)) {
      const depth = this.getObjectDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }
}
