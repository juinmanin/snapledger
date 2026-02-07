import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetAlertService {
  private readonly logger = new Logger(BudgetAlertService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 21 * * *') // Every day at 9 PM
  async checkBudgetThresholds() {
    this.logger.log('Running budget threshold check...');

    try {
      const now = new Date();
      
      // Get all active budgets
      const budgets = await this.prisma.budget.findMany({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          user: true,
          category: true,
        },
      });

      for (const budget of budgets) {
        const spent = await this.calculateSpent(
          budget.userId,
          budget.startDate,
          budget.endDate,
          budget.categoryId,
        );

        const percentage = (spent / budget.amount.toNumber()) * 100;
        const threshold = budget.alertThreshold.toNumber();

        // Send warning notification
        if (percentage >= threshold && percentage < 100) {
          await this.createNotification(
            budget.userId,
            'budget_warning',
            '예산 경고',
            `${budget.category?.name || '전체'} 예산의 ${Math.round(percentage)}%를 사용했습니다.`,
            { budgetId: budget.id, percentage, spent, limit: budget.amount.toNumber() },
          );
        }

        // Send exceeded notification
        if (percentage >= 100) {
          await this.createNotification(
            budget.userId,
            'budget_exceeded',
            '예산 초과',
            `${budget.category?.name || '전체'} 예산을 초과했습니다.`,
            { budgetId: budget.id, percentage, spent, limit: budget.amount.toNumber() },
          );
        }
      }

      this.logger.log(`Budget check completed. Checked ${budgets.length} budgets.`);
    } catch (error) {
      this.logger.error(`Budget check failed: ${error.message}`);
    }
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
      transactionDate: { gte: startDate, lte: endDate },
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

  private async createNotification(
    userId: string,
    type: any,
    title: string,
    body: string,
    data: any,
  ) {
    // Check if similar notification already exists today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: today },
        data: { path: ['budgetId'], equals: data.budgetId },
      },
    });

    if (existing) {
      this.logger.log(`Notification already sent for budget ${data.budgetId}`);
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
      },
    });

    this.logger.log(`Notification created for user ${userId}: ${title}`);
  }
}
