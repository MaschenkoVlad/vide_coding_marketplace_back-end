export class CategoryResponseDto {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
}

export class CategoryWithListingsCountResponseDto {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
  _count: {
    listings: number;
  };
}
