import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        description: dto.description,
        date: new Date(dto.date),
        type: dto.type,
        paymentMethod: dto.paymentMethod,
        receiptId: dto.receiptId,
        notes: dto.notes,
      },
      include: {
        category: true,
        receipt: true,
      },
    });
  }

  async findAll(
    userId: string,
    filters?: {
      categoryId?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
    },
  ) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.startDate &&
          filters?.endDate && {
            date: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      include: {
        category: true,
        receipt: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip: filters?.skip,
      take: filters?.take,
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        receipt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    await this.findOne(id, userId);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.amount && { amount: dto.amount }),
        ...(dto.description && { description: dto.description }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.type && { type: dto.type }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        category: true,
        receipt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.transaction.delete({ where: { id } });
  }

  async getStatistics(userId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions.reduce((acc, t) => {
      const categoryName = t.category?.name || 'Unknown';
      if (!acc[categoryName]) {
        acc[categoryName] = { total: 0, count: 0, type: t.type };
      }
      acc[categoryName].total += t.amount;
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; type: string }>);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryBreakdown,
      transactionCount: transactions.length,
    };
  }
}
