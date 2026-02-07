import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(private prisma: PrismaService) {}

  async exportToGoogleSheet(
    userId: string,
    period: { start: Date; end: Date },
    sheetTitle?: string,
  ): Promise<{ spreadsheetId: string; url: string }> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthAccount || !oauthAccount.accessToken) {
        throw new Error('Google account not connected');
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: oauthAccount.accessToken,
        refresh_token: oauthAccount.refreshToken,
      });

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: sheetTitle || `SnapLedger Export - ${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [
            { properties: { title: '거래내역' } },
            { properties: { title: '카테고리별 요약' } },
            { properties: { title: '월별 추세' } },
          ],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;
      
      if (!spreadsheetId) {
        throw new Error('Failed to create spreadsheet');
      }

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
        orderBy: {
          date: 'desc',
        },
      });

      const transactionRows = [
        ['날짜', '카테고리', '설명', '유형', '금액', '결제수단'],
        ...transactions.map((t) => [
          t.date.toISOString().split('T')[0],
          t.category.name,
          t.description,
          t.type === 'INCOME' ? '수입' : '지출',
          t.amount.toString(),
          t.paymentMethod || '',
        ]),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '거래내역!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: transactionRows,
        },
      });

      const categoryStats = await this.getCategoryStats(userId, period);
      const categoryRows = [
        ['카테고리', '거래 건수', '총액', '평균'],
        ...Object.entries(categoryStats).map(([category, stats]: [string, any]) => [
          category,
          stats.count.toString(),
          stats.total.toString(),
          stats.average.toString(),
        ]),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '카테고리별 요약!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: categoryRows,
        },
      });

      const monthlyData = await this.getMonthlyTrend(userId, period);
      const monthlyRows = [
        ['월', '수입', '지출', '순액'],
        ...monthlyData.map((m) => [
          m.month,
          m.income.toString(),
          m.expense.toString(),
          m.net.toString(),
        ]),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '월별 추세!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: monthlyRows,
        },
      });

      this.logger.log(`Exported to Google Sheets: ${spreadsheetId}`);

      return {
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      };
    } catch (error) {
      this.logger.error('Google Sheets export failed:', error);
      throw error;
    }
  }

  private async getCategoryStats(
    userId: string,
    period: { start: Date; end: Date },
  ): Promise<Record<string, { count: number; total: number; average: number }>> {
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

    const stats: Record<string, { count: number; total: number; average: number }> = {};

    transactions.forEach((t) => {
      const categoryName = t.category.name;
      if (!stats[categoryName]) {
        stats[categoryName] = { count: 0, total: 0, average: 0 };
      }
      stats[categoryName].count++;
      stats[categoryName].total += t.amount;
    });

    Object.keys(stats).forEach((category) => {
      stats[category].average = stats[category].total / stats[category].count;
    });

    return stats;
  }

  private async getMonthlyTrend(
    userId: string,
    period: { start: Date; end: Date },
  ): Promise<Array<{ month: string; income: number; expense: number; net: number }>> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
    });

    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((t) => {
      const month = t.date.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }

      if (t.type === 'INCOME') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expense += t.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
