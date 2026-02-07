import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatternLearningService {
  private readonly logger = new Logger(PatternLearningService.name);

  constructor(private prisma: PrismaService) {}

  async updateUserPatterns(userId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: thirtyDaysAgo },
        },
        include: {
          category: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      const patterns = this.calculatePatterns(transactions);

      for (const [dayType, pattern] of Object.entries(patterns)) {
        await this.prisma.userPattern.upsert({
          where: {
            userId_dayType: {
              userId,
              dayType: dayType as string,
            },
          },
          update: {
            avgTransactions: pattern.avgTransactions,
            avgSpending: pattern.avgSpending,
            hourlyPattern: pattern.hourlyPattern,
          },
          create: {
            userId,
            dayType: dayType as string,
            avgTransactions: pattern.avgTransactions,
            avgSpending: pattern.avgSpending,
            hourlyPattern: pattern.hourlyPattern,
          },
        });
      }

      this.logger.log(`Updated patterns for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update patterns for user ${userId}:`, error);
    }
  }

  private calculatePatterns(transactions: any[]) {
    const dayTypeGroups = {
      WEEKDAY: [] as any[],
      WEEKEND: [] as any[],
      HOLIDAY: [] as any[],
    };

    const dayTypeCounts = {
      WEEKDAY: new Set<string>(),
      WEEKEND: new Set<string>(),
      HOLIDAY: new Set<string>(),
    };

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const day = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      
      let dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
      if (day === 0 || day === 6) {
        dayType = 'WEEKEND';
      } else {
        dayType = 'WEEKDAY';
      }

      dayTypeGroups[dayType].push(tx);
      dayTypeCounts[dayType].add(dateStr);
    }

    const patterns: Record<string, any> = {};

    for (const [dayType, txs] of Object.entries(dayTypeGroups)) {
      const dayCount = dayTypeCounts[dayType].size || 1;
      const totalSpending = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const hourlyData = this.calculateHourlyPattern(txs);

      patterns[dayType] = {
        avgTransactions: txs.length / dayCount,
        avgSpending: totalSpending / dayCount,
        hourlyPattern: hourlyData,
      };
    }

    return patterns;
  }

  private calculateHourlyPattern(transactions: any[]) {
    const hourlyMap: { [key: number]: { transactions: any[], total: number } } = {};

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const hour = date.getHours();

      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { transactions: [], total: 0 };
      }

      hourlyMap[hour].transactions.push(tx);
      hourlyMap[hour].total += tx.amount || 0;
    }

    const hourlyPattern: any[] = [];
    for (const [hour, data] of Object.entries(hourlyMap)) {
      const categories: { [key: string]: number } = {};
      
      for (const tx of data.transactions) {
        const categoryName = tx.category?.name || 'Uncategorized';
        categories[categoryName] = (categories[categoryName] || 0) + 1;
      }

      const topCategory = Object.entries(categories)
        .sort(([, a], [, b]) => b - a)[0];

      hourlyPattern.push({
        hour: parseInt(hour),
        category: topCategory ? topCategory[0] : 'Uncategorized',
        avgAmount: data.total / data.transactions.length,
        frequency: data.transactions.length / 30,
      });
    }

    return hourlyPattern;
  }

  async getUserPatterns(userId: string) {
    return await this.prisma.userPattern.findMany({
      where: { userId },
    });
  }
}
