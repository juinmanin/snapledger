import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DailyAnalysisService } from './daily-analysis.service';
import { PatternLearningService } from './pattern-learning.service';

@Injectable()
export class AnalysisSchedulerService {
  private readonly logger = new Logger(AnalysisSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private dailyAnalysis: DailyAnalysisService,
    private patternLearning: PatternLearningService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runScheduledAnalysis() {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();

      const timeString = `${currentHour.toString().padStart(2, '0')}:00`;

      const usersToAnalyze = await this.prisma.analysisSettings.findMany({
        where: {
          enabled: true,
          analysisTime: {
            startsWith: timeString.substring(0, 2),
          },
        },
      });

      this.logger.log(
        `Found ${usersToAnalyze.length} users for analysis at hour ${currentHour}`,
      );

      for (const settings of usersToAnalyze) {
        try {
          await this.dailyAnalysis.analyzeDailyTransactions(settings.userId);
          this.logger.log(`Analysis completed for user ${settings.userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to analyze for user ${settings.userId}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Scheduled analysis failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateAllPatterns() {
    try {
      this.logger.log('Starting daily pattern update for all users');

      const users = await this.prisma.user.findMany({
        select: { id: true },
      });

      for (const user of users) {
        try {
          await this.patternLearning.updateUserPatterns(user.id);
        } catch (error) {
          this.logger.error(
            `Failed to update patterns for user ${user.id}:`,
            error,
          );
        }
      }

      this.logger.log(`Pattern update completed for ${users.length} users`);
    } catch (error) {
      this.logger.error('Pattern update failed:', error);
    }
  }
}
