import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../infrastructure/category.repository';
import type { Category, CategoryWithListingsCount } from '../domain/category.types';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoriesWithListingsCount(): Promise<CategoryWithListingsCount[]> {
    return this.categoryRepository.findWithListingsCount();
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return this.categoryRepository.findBySlug(slug);
  }
}
