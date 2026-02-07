import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getIncomeExpenseReport(userId: string, query: ReportQueryDto) {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      const where: any = {
        userId,
        deletedAt: null,
        transactionDate: { gte: startDate, lte: endDate },
      };

      // Total income and expense
      const [income, expense] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { ...where, transactionType: 'income' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, transactionType: 'expense' },
          _sum: { amount: true },
        }),
      ]);

      // By category
      const transactions = await this.prisma.transaction.findMany({
        where,
        include: { category: true },
      });

      const categoryMap = new Map();
      let totalAmount = 0;

      for (const tx of transactions) {
        const key = tx.categoryId;
        const amount = tx.amount.toNumber();
        totalAmount += amount;

        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            categoryId: tx.categoryId,
            categoryName: tx.category.name,
            categoryType: tx.category.categoryType,
            amount: 0,
          });
        }

        categoryMap.get(key).amount += amount;
      }

      const byCategory = Array.from(categoryMap.values()).map((item) => ({
        ...item,
        percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 10000) / 100 : 0,
      }));

      // Daily trend
      const dailyTrend = await this.getDailyTrend(userId, startDate, endDate);

      return {
        summary: {
          totalIncome: income._sum.amount?.toNumber() || 0,
          totalExpense: expense._sum.amount?.toNumber() || 0,
          balance: (income._sum.amount?.toNumber() || 0) - (expense._sum.amount?.toNumber() || 0),
        },
        byCategory,
        dailyTrend,
      };
    } catch (error) {
      this.logger.error(`Get income/expense report failed: ${error.message}`);
      throw error;
    }
  }

  async getTaxSummary(userId: string, query: ReportQueryDto) {
    try {
      const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = query.endDate ? new Date(query.endDate) : new Date();

      // Get tax-deductible expenses
      const taxDeductibleExpenses = await this.prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          transactionType: 'expense',
          transactionDate: { gte: startDate, lte: endDate },
          category: { taxDeductible: true },
        },
        include: { category: true },
      });

      const deductibleByCategory = taxDeductibleExpenses.reduce((acc, tx) => {
        const key = tx.category.name;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += tx.amount.toNumber();
        return acc;
      }, {} as Record<string, number>);

      const totalDeductible = taxDeductibleExpenses.reduce(
        (sum, tx) => sum + tx.amount.toNumber(),
        0,
      );

      // Get sales (매출) for business
      const sales = await this.prisma.transaction.aggregate({
        where: {
          userId,
          deletedAt: null,
          transactionType: 'income',
          transactionDate: { gte: startDate, lte: endDate },
          category: { name: '매출' },
        },
        _sum: { amount: true },
      });

      // Get receipts with VAT
      const receiptsWithVat = await this.prisma.receipt.findMany({
        where: {
          userId,
          receiptDate: { gte: startDate, lte: endDate },
          taxAmount: { not: null },
        },
        select: {
          id: true,
          merchantName: true,
          receiptDate: true,
          totalAmount: true,
          taxAmount: true,
        },
      });

      const totalVat = receiptsWithVat.reduce(
        (sum, receipt) => sum + (receipt.taxAmount?.toNumber() || 0),
        0,
      );

      return {
        sales: sales._sum.amount?.toNumber() || 0,
        totalDeductibleExpenses: totalDeductible,
        deductibleByCategory,
        vatPayable: totalVat,
        receiptsWithVat: receiptsWithVat.length,
        estimatedTaxSavings: Math.round(totalDeductible * 0.2), // Estimated at 20%
      };
    } catch (error) {
      this.logger.error(`Get tax summary failed: ${error.message}`);
      throw error;
    }
  }

  private async getDailyTrend(userId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: { gte: startDate, lte: endDate },
      },
      orderBy: { transactionDate: 'asc' },
    });

    const dailyMap = new Map();

    for (const tx of transactions) {
      const dateKey = tx.transactionDate.toISOString().split('T')[0];

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey, income: 0, expense: 0 });
      }

      const day = dailyMap.get(dateKey);
      if (tx.transactionType === 'income') {
        day.income += tx.amount.toNumber();
      } else if (tx.transactionType === 'expense') {
        day.expense += tx.amount.toNumber();
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
