import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorators';
import { ListingService } from '../application/listing.service';
import type { ListingResponseDto } from '../dto/listing.dto';
import { CreateListingDto, UpdateListingDto } from '../dto/listing.dto';
import { UserRole } from '../../users/domain/user.types';
import { AuthenticatedRequest } from '../../auth/constants/auth.constants';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seller/listings')
export class SellerListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async createListing(
    @Request() req: AuthenticatedRequest,
    @Body() createListingDto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingService.createListing(req.user!.userId, createListingDto);
    return listing;
  }

  @Get()
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getSellerListings(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ listings: ListingResponseDto[]; total: number }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.listingService.getSellerListings(req.user!.userId, {
      page: pageNum,
      limit: limitNum,
    });

    return result;
  }

  @Get(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getListing(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingService.getListingById(id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Check ownership
    if (listing.sellerId !== req.user!.userId) {
      throw new Error('Access denied');
    }

    return listing;
  }

  @Patch(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateListing(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingService.updateListing(id, req.user!.userId, updateListingDto);
  }

  @Post(':id/publish')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async publishListing(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingService.publishListing(id, req.user!.userId);
  }

  @Post(':id/archive')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async archiveListing(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingService.archiveListing(id, req.user!.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async deleteListing(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.listingService.deleteListing(id, req.user!.userId);
  }
}
