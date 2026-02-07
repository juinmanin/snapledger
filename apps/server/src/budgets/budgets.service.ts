import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    try {
      const budget = await this.prisma.budget.create({
        data: {
          userId,
          amount: new Decimal(dto.amount),
          periodType: dto.periodType,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          categoryId: dto.categoryId,
          alertThreshold: new Decimal(dto.alertThreshold || 80),
        },
        include: {
          category: true,
        },
      });

      this.logger.log(`Budget created: ${budget.id}`);

      return budget;
    } catch (error) {
      this.logger.error(`Create budget failed: ${error.message}`);
      throw error;
    }
  }

  async list(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { startDate: 'desc' },
    });

    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpent(
          userId,
          budget.startDate,
          budget.endDate,
          budget.categoryId,
        );

        const percentage = (spent / budget.amount.toNumber()) * 100;

        return {
          ...budget,
          spent,
          remaining: budget.amount.toNumber() - spent,
          percentage: Math.round(percentage * 100) / 100,
        };
      }),
    );

    return budgetsWithUsage;
  }

  async getById(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const spent = await this.calculateSpent(
      userId,
      budget.startDate,
      budget.endDate,
      budget.categoryId,
    );

    const percentage = (spent / budget.amount.toNumber()) * 100;

    return {
      ...budget,
      spent,
      remaining: budget.amount.toNumber() - spent,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  async update(userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const updateData: any = {};

    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    if (dto.alertThreshold !== undefined) updateData.alertThreshold = new Decimal(dto.alertThreshold);

    const updated = await this.prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: {
        category: true,
      },
    });

    this.logger.log(`Budget updated: ${budgetId}`);

    return updated;
  }

  async delete(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budget.delete({
      where: { id: budgetId },
    });

    this.logger.log(`Budget deleted: ${budgetId}`);

    return { message: 'Budget deleted successfully' };
  }

  private async calculateSpent(
    userId: string,
    startDate: Date,
    endDate: Date,
    categoryId?: string | null,
  ): Promise<number> {
    const where: any = {
      userId,
      transactionType: 'expense',
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const result = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() || 0;
  }
}
