export enum ListingCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SOLD = 'SOLD',
  BLOCKED = 'BLOCKED',
}

export enum Currency {
  USD = 'USD',
  UAH = 'UAH',
}

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number; // in cents
  currency: Currency;
  condition: ListingCondition;
  city?: string | null;
  attributes: Record<string, unknown>;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingWithRelations extends Listing {
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

export interface CreateListingData {
  categoryId: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  condition: ListingCondition;
  city?: string;
  attributes?: Record<string, any>;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  price?: number;
  currency?: Currency;
  condition?: ListingCondition;
  city?: string;
  attributes?: Record<string, any>;
}

export interface ListingFilters {
  categoryId?: string;
  condition?: ListingCondition;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface ListingSearchResult {
  listings: ListingWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublishListingData {
  id: string;
  sellerId: string;
}

export interface ArchiveListingData {
  id: string;
  sellerId: string;
}
