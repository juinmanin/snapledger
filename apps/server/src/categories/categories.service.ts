import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async findAll(userId: string, type?: string) {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, userId: string, dto: Partial<CreateCategoryDto>) {
    await this.findOne(id, userId);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          userId,
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing transactions',
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async initializeDefaultCategories(userId: string) {
    const defaultCategories = [
      { name: 'Food & Dining', type: 'EXPENSE', icon: '🍔', color: '#FF6B6B' },
      { name: 'Transportation', type: 'EXPENSE', icon: '🚗', color: '#4ECDC4' },
      { name: 'Shopping', type: 'EXPENSE', icon: '🛍️', color: '#95E1D3' },
      { name: 'Entertainment', type: 'EXPENSE', icon: '🎬', color: '#F38181' },
      { name: 'Healthcare', type: 'EXPENSE', icon: '⚕️', color: '#AA96DA' },
      { name: 'Bills & Utilities', type: 'EXPENSE', icon: '💡', color: '#FCBAD3' },
      { name: 'Groceries', type: 'EXPENSE', icon: '🛒', color: '#A8D8EA' },
      { name: 'Travel', type: 'EXPENSE', icon: '✈️', color: '#FFD93D' },
      { name: 'Education', type: 'EXPENSE', icon: '📚', color: '#6BCB77' },
      { name: 'Salary', type: 'INCOME', icon: '💰', color: '#4D96FF' },
      { name: 'Freelance', type: 'INCOME', icon: '💼', color: '#6BCB77' },
      { name: 'Investment', type: 'INCOME', icon: '📈', color: '#FFD93D' },
      { name: 'Other', type: 'EXPENSE', icon: '📌', color: '#95A5A6' },
    ];

    await this.prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId,
      })),
      skipDuplicates: true,
    });
  }
}
