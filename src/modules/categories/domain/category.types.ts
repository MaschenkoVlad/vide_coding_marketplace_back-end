export interface Category {
  id: string;
  slug: string;
  name: string;
  createdAt: Date;
}

export interface CreateCategoryData {
  slug: string;
  name: string;
}

export interface CategoryWithListingsCount extends Category {
  _count: {
    listings: number;
  };
}
