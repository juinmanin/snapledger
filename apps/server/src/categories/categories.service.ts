import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, ListCategoriesQueryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: {
          userId,
          name: dto.name,
          categoryType: dto.categoryType,
          mode: dto.mode || 'both',
          parentId: dto.parentId,
          icon: dto.icon,
          color: dto.color,
          taxDeductible: dto.taxDeductible || false,
        },
      });

      this.logger.log(`Category created: ${category.id}`);

      return category;
    } catch (error) {
      this.logger.error(`Create category failed: ${error.message}`);
      throw error;
    }
  }

  async list(userId: string, query: ListCategoriesQueryDto) {
    const where: any = {
      OR: [
        { userId: null }, // System categories
        { userId }, // User categories
      ],
      isActive: true,
    };

    if (query.type) {
      where.categoryType = query.type;
    }

    if (query.mode) {
      where.mode = { in: [query.mode, 'both'] };
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  async getById(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: null }, { userId }],
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found or not owned by user');
    }

    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
    });

    this.logger.log(`Category updated: ${categoryId}`);

    return updated;
  }

  async delete(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found or not owned by user');
    }

    await this.prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });

    this.logger.log(`Category soft deleted: ${categoryId}`);

    return { message: 'Category deleted successfully' };
  }
}
