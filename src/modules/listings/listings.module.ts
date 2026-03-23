import { Module } from '@nestjs/common';
import { SellerListingController } from './controllers/seller.listing.controller';
import { PublicListingController } from './controllers/public.listing.controller';
import { ListingService } from './application/listing.service';
import { ListingRepository } from './infrastructure/listing.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SellerListingController, PublicListingController],
  providers: [ListingService, ListingRepository],
  exports: [ListingService, ListingRepository],
})
export class ListingsModule {}
