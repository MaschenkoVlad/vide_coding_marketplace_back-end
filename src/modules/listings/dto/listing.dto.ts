import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  MaxLength,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingCondition, Currency } from '../domain/listing.types';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @Min(0)
  price: number; // in cents

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(ListingCondition)
  condition: ListingCondition;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

export class ListingFiltersDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceMax?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'price_asc' | 'price_desc';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export class ListingResponseDto {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  city?: string | null;
  attributes: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListingWithRelationsResponseDto {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  city?: string | null;
  attributes: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    id: string;
    slug: string;
    name: string;
  };
}

export class ListingSearchResultDto {
  listings: ListingWithRelationsResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
