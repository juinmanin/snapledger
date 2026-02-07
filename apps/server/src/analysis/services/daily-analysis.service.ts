import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PatternLearningService } from './pattern-learning.service';

@Injectable()
export class DailyAnalysisService {
  private readonly logger = new Logger(DailyAnalysisService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private patternLearning: PatternLearningService,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeDailyTransactions(userId: string, date?: Date) {
    try {
      const analysisDate = date || new Date();
      analysisDate.setHours(0, 0, 0, 0);

      const settings = await this.getOrCreateSettings(userId);
      
      if (!settings.enabled) {
        this.logger.log(`Analysis disabled for user ${userId}`);
        return null;
      }

      const dayOfWeek = analysisDate.getDay();
      if (settings.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        this.logger.log(`Skipping weekend analysis for user ${userId}`);
        return null;
      }

      const transactions = await this.collectTodaysTransactions(userId, analysisDate);
      const patterns = await this.patternLearning.getUserPatterns(userId);

      const alerts: any[] = [];
      
      if (settings.checkMeals) {
        const mealAlerts = this.checkMissingMeals(transactions, analysisDate);
        alerts.push(...mealAlerts);
      }

      if (settings.checkTransport) {
        const transportAlerts = this.checkMissingTransport(transactions, patterns);
        alerts.push(...transportAlerts);
      }

      if (settings.checkDuplicates) {
        const duplicateAlerts = this.detectDuplicates(transactions);
        alerts.push(...duplicateAlerts);
      }

      if (settings.checkPatterns) {
        const patternAlerts = this.checkPatternDeviations(transactions, patterns);
        alerts.push(...patternAlerts);
      }

      const taxTips = await this.generateTaxTips(userId, transactions);
      const summary = await this.generateAISummary(transactions, alerts, settings.messageStyle);

      const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      const analysis = await this.prisma.dailyAnalysis.upsert({
        where: {
          userId_date: {
            userId,
            date: analysisDate,
          },
        },
        update: {
          totalTransactions: transactions.length,
          totalAmount,
          alerts,
          taxTips,
          summary,
        },
        create: {
          userId,
          date: analysisDate,
          totalTransactions: transactions.length,
          totalAmount,
          alerts,
          taxTips,
          summary,
        },
      });

      this.logger.log(`Analysis completed for user ${userId} on ${analysisDate.toISOString()}`);
      return analysis;
    } catch (error) {
      this.logger.error(`Daily analysis failed for user ${userId}:`, error);
      throw error;
    }
  }

  private async collectTodaysTransactions(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        category: true,
        receipt: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  private checkMissingMeals(transactions: any[], date: Date): any[] {
    const alerts: any[] = [];
    const mealCategories = ['food', 'restaurant', 'dining', 'lunch', 'dinner', 'breakfast'];
    
    const hasMealTransaction = transactions.some((tx) =>
      mealCategories.some((cat) =>
        tx.category?.name?.toLowerCase().includes(cat) ||
        tx.description?.toLowerCase().includes(cat)
      )
    );

    if (!hasMealTransaction && date.getDay() >= 1 && date.getDay() <= 5) {
      alerts.push({
        type: 'MISSING_MEAL',
        severity: 'INFO',
        message: 'No meal expenses recorded today. Did you forget to log your lunch?',
        suggestions: ['Add lunch receipt', 'Check if you paid with cash'],
      });
    }

    return alerts;
  }

  private checkMissingTransport(transactions: any[], patterns: any[]): any[] {
    const alerts: any[] = [];
    const transportCategories = ['transport', 'transit', 'subway', 'bus', 'taxi', 'uber'];
    
    const hasTransportTransaction = transactions.some((tx) =>
      transportCategories.some((cat) =>
        tx.category?.name?.toLowerCase().includes(cat) ||
        tx.description?.toLowerCase().includes(cat)
      )
    );

    if (!hasTransportTransaction) {
      alerts.push({
        type: 'MISSING_TRANSPORT',
        severity: 'INFO',
        message: 'No transportation expenses today. Did you commute?',
        suggestions: ['Add transit card usage', 'Log parking fees'],
      });
    }

    return alerts;
  }

  private detectDuplicates(transactions: any[]): any[] {
    const alerts: any[] = [];
    const seen = new Map();

    for (const tx of transactions) {
      const key = `${tx.amount}-${tx.merchantName}-${new Date(tx.date).getHours()}`;
      
      if (seen.has(key)) {
        alerts.push({
          type: 'DUPLICATE_SUSPECTED',
          severity: 'WARNING',
          message: `Possible duplicate: ${tx.merchantName} - ${tx.amount}`,
          transactionIds: [seen.get(key), tx.id],
          suggestions: ['Review and delete duplicate', 'Confirm if both are valid'],
        });
      } else {
        seen.set(key, tx.id);
      }
    }

    return alerts;
  }

  private checkPatternDeviations(transactions: any[], patterns: any[]): any[] {
    const alerts: any[] = [];

    if (transactions.length === 0 && patterns.length > 0) {
      alerts.push({
        type: 'NO_TRANSACTIONS',
        severity: 'INFO',
        message: 'No transactions recorded today. This is unusual based on your pattern.',
        suggestions: ['Check if receipts need to be uploaded'],
      });
    }

    return alerts;
  }

  private async generateTaxTips(userId: string, transactions: any[]) {
    const tips: any[] = [];

    const deductibleCount = transactions.filter((tx) => tx.isDeductible).length;
    const totalDeductible = transactions
      .filter((tx) => tx.isDeductible)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    if (deductibleCount > 0) {
      tips.push({
        type: 'DEDUCTIBLE_SUMMARY',
        message: `You have ${deductibleCount} tax-deductible transactions today totaling ${totalDeductible.toFixed(2)}`,
      });
    }

    const medicalTxs = transactions.filter((tx) => tx.taxCategory === 'MEDICAL');
    if (medicalTxs.length > 0) {
      tips.push({
        type: 'MEDICAL_DEDUCTION',
        message: 'Medical expenses can be deducted. Keep your receipts!',
      });
    }

    return tips;
  }

  private async generateAISummary(
    transactions: any[],
    alerts: any[],
    messageStyle: string,
  ): Promise<string> {
    try {
      if (transactions.length === 0 && alerts.length === 0) {
        return 'No activity today.';
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        You are a helpful financial assistant analyzing daily spending.
        Message style: ${messageStyle}
        
        Transactions today: ${transactions.length}
        Total spent: ${transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)}
        
        Alerts detected: ${alerts.length}
        ${alerts.map((a) => `- ${a.message}`).join('\n')}
        
        Provide a brief, ${messageStyle.toLowerCase()} summary (2-3 sentences) about today's spending and any important alerts.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error('AI summary generation failed:', error);
      return `${transactions.length} transactions recorded today. ${alerts.length} alerts to review.`;
    }
  }

  private async getOrCreateSettings(userId: string) {
    let settings = await this.prisma.analysisSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.analysisSettings.create({
        data: {
          userId,
          enabled: true,
          analysisTime: '21:00',
          messageStyle: 'FRIENDLY',
          checkMeals: true,
          checkTransport: true,
          checkDuplicates: true,
          checkPatterns: true,
          skipWeekends: true,
          skipHolidays: true,
        },
      });
    }

    return settings;
  }

  async getDailyAnalysis(userId: string, date?: Date) {
    const queryDate = date || new Date();
    queryDate.setHours(0, 0, 0, 0);

    return await this.prisma.dailyAnalysis.findUnique({
      where: {
        userId_date: {
          userId,
          date: queryDate,
        },
      },
    });
  }

  async submitFeedback(userId: string, analysisId: string, feedback: string) {
    return await this.prisma.dailyAnalysis.update({
      where: {
        id: analysisId,
        userId,
      },
      data: {
        feedbackGiven: true,
      },
    });
  }
}
