import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TransactionCreateInput) {
    return this.prisma.transaction.create({
      data,
      include: {
        category: true,
        account: true,
        receipt: true,
      },
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        category: true,
        account: true,
        receipt: true,
      },
    });
  }

  async findMany(userId: string, filters: any) {
    const where: any = { userId };

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.type) {
      where.transactionType = filters.type;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transactionDate.lte = new Date(filters.endDate);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          category: true,
          account: true,
          receipt: {
            select: {
              id: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async update(id: string, userId: string, data: Prisma.TransactionUpdateInput) {
    return this.prisma.transaction.update({
      where: { id, userId },
      data,
      include: {
        category: true,
        account: true,
        receipt: true,
      },
    });
  }

  async softDelete(id: string, userId: string) {
    return this.prisma.transaction.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string, userId: string) {
    return this.prisma.transaction.delete({
      where: { id, userId },
    });
  }

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId, deletedAt: null };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = startDate;
      if (endDate) where.transactionDate.lte = endDate;
    }

    const [income, expense, byCategoryData] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, transactionType: 'income' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, transactionType: 'expense' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: byCategoryData.map((item) => item.categoryId) },
      },
    });

    const byCategory = byCategoryData.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categories.find((c) => c.id === item.categoryId)?.name || 'Unknown',
      amount: item._sum.amount,
    }));

    return {
      totalIncome: income._sum.amount?.toNumber() || 0,
      totalExpense: expense._sum.amount?.toNumber() || 0,
      balance: ((income._sum.amount || new Decimal(0)) as Decimal).toNumber() - ((expense._sum.amount || new Decimal(0)) as Decimal).toNumber(),
      byCategory,
    };
  }
}
