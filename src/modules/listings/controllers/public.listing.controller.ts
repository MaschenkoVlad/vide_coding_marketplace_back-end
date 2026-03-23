import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ListingService } from '../application/listing.service';
import type { ListingWithRelationsResponseDto, ListingSearchResultDto } from '../dto/listing.dto';
import { ListingFiltersDto } from '../dto/listing.dto';

@Controller('listings')
export class PublicListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  async getPublishedListings(@Query() filters: ListingFiltersDto): Promise<ListingSearchResultDto> {
    const result = await this.listingService.getPublishedListings(filters);
    return result;
  }

  @Get(':id')
  async getListingDetails(@Param('id') id: string): Promise<ListingWithRelationsResponseDto> {
    const listing = await this.listingService.getListingByIdWithRelations(id);

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Only show published listings to public
    if (listing.status !== 'PUBLISHED') {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }
}
