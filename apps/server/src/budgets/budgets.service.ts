import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(userId: string, active?: boolean) {
    const now = new Date();
    
    return this.prisma.budget.findMany({
      where: {
        userId,
        ...(active && {
          startDate: { lte: now },
          endDate: { gte: now },
        }),
      },
      include: {
        category: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async update(id: string, userId: string, dto: Partial<CreateBudgetDto>) {
    await this.findOne(id, userId);

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.amount && { amount: dto.amount }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }

  async getBudgetProgress(userId: string) {
    const now = new Date();
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        category: true,
      },
    });

    const progressData = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: budget.startDate,
              lte: budget.endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spentAmount = spent._sum.amount || 0;
        const percentage = (spentAmount / budget.amount) * 100;

        return {
          budget,
          spent: spentAmount,
          remaining: budget.amount - spentAmount,
          percentage,
          status:
            percentage >= 100
              ? 'exceeded'
              : percentage >= 80
              ? 'warning'
              : 'on-track',
        };
      }),
    );

    return progressData;
  }
}
