import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getFinancialSummary(
    userId: string,
    period: { start: Date; end: Date },
  ) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      include: {
        category: true,
      },
    });

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = transactions.reduce((acc, t) => {
      const category = t.category.name;
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          count: 0,
          type: t.type,
          percentage: 0,
        };
      }
      acc[category].total += t.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number; type: string; percentage: number }>);

    Object.keys(categoryBreakdown).forEach((category) => {
      const total = categoryBreakdown[category].type === 'INCOME' ? income : expenses;
      categoryBreakdown[category].percentage = (categoryBreakdown[category].total / total) * 100;
    });

    const paymentMethodBreakdown = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'Unknown';
      if (!acc[method]) {
        acc[method] = { total: 0, count: 0 };
      }
      acc[method].total += t.amount;
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return {
      period,
      summary: {
        income,
        expenses,
        balance: income - expenses,
        transactionCount: transactions.length,
      },
      categoryBreakdown,
      paymentMethodBreakdown,
    };
  }

  async getCashFlow(
    userId: string,
    period: { start: Date; end: Date },
    groupBy: 'day' | 'week' | 'month' = 'month',
  ) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const cashFlow: Record<string, { income: number; expense: number; net: number }> = {};

    transactions.forEach((t) => {
      let key: string;
      
      if (groupBy === 'day') {
        key = t.date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const date = new Date(t.date);
        const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
        key = firstDay.toISOString().split('T')[0];
      } else {
        key = t.date.toISOString().substring(0, 7);
      }

      if (!cashFlow[key]) {
        cashFlow[key] = { income: 0, expense: 0, net: 0 };
      }

      if (t.type === 'INCOME') {
        cashFlow[key].income += t.amount;
      } else {
        cashFlow[key].expense += t.amount;
      }
    });

    Object.keys(cashFlow).forEach((key) => {
      cashFlow[key].net = cashFlow[key].income - cashFlow[key].expense;
    });

    return Object.entries(cashFlow)
      .map(([period, data]) => ({
        period,
        ...data,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  async getSpendingTrends(
    userId: string,
    categoryId: string,
    months: number = 6,
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const monthlyData: Record<string, { total: number; count: number; average: number }> = {};

    transactions.forEach((t) => {
      const month = t.date.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0, average: 0 };
      }
      monthlyData[month].total += t.amount;
      monthlyData[month].count += 1;
    });

    Object.keys(monthlyData).forEach((month) => {
      monthlyData[month].average = monthlyData[month].total / monthlyData[month].count;
    });

    const trend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));

    const avgMonthlySpend =
      trend.reduce((sum, m) => sum + m.total, 0) / trend.length;

    return {
      trend,
      averageMonthlySpend: avgMonthlySpend,
      months,
    };
  }
}
