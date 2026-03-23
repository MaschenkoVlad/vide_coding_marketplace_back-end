import { Controller, Get, Param } from '@nestjs/common';
import { CategoryService } from '../application/category.service';
import type {
  CategoryResponseDto,
  CategoryWithListingsCountResponseDto,
} from '../dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.getAllCategories();
    return categories;
  }

  @Get('with-count')
  async getCategoriesWithCount(): Promise<CategoryWithListingsCountResponseDto[]> {
    const categories = await this.categoryService.getCategoriesWithListingsCount();
    return categories;
  }

  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  @Get('slug/:slug')
  async getCategoryBySlug(@Param('slug') slug: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.getCategoryBySlug(slug);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }
}
