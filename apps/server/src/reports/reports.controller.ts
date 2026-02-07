import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { GoogleSheetsService } from '../integrations/google-sheets.service';
import { GoogleDriveService } from '../integrations/google-drive.service';

@ApiTags('reports')
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private googleSheetsService: GoogleSheetsService,
    private googleDriveService: GoogleDriveService,
  ) {}

  @Get('reports/summary')
  @ApiOperation({ summary: 'Get financial summary report' })
  @ApiResponse({ status: 200, description: 'Returns financial summary' })
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getFinancialSummary(userId, {
      start: new Date(startDate),
      end: new Date(endDate),
    });
  }

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiResponse({ status: 200, description: 'Returns cash flow data' })
  async getCashFlow(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.reportsService.getCashFlow(
      userId,
      {
        start: new Date(startDate),
        end: new Date(endDate),
      },
      groupBy,
    );
  }

  @Get('reports/spending-trends')
  @ApiOperation({ summary: 'Get spending trends for a category' })
  @ApiResponse({ status: 200, description: 'Returns spending trends' })
  async getSpendingTrends(
    @CurrentUser('id') userId: string,
    @Query('categoryId') categoryId: string,
    @Query('months') months?: string,
  ) {
    return this.reportsService.getSpendingTrends(
      userId,
      categoryId,
      months ? parseInt(months) : 6,
    );
  }

  @Post('reports/export/google-sheets')
  @ApiOperation({ summary: 'Export data to Google Sheets' })
  @ApiResponse({ status: 201, description: 'Export successful' })
  async exportToGoogleSheets(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      sheetTitle?: string;
    },
  ) {
    return this.googleSheetsService.exportToGoogleSheet(
      userId,
      {
        start: new Date(body.startDate),
        end: new Date(body.endDate),
      },
      body.sheetTitle,
    );
  }

  @Post('backup/google-drive')
  @ApiOperation({ summary: 'Backup data to Google Drive' })
  @ApiResponse({ status: 201, description: 'Backup successful' })
  async backupToGoogleDrive(@CurrentUser('id') userId: string) {
    return this.googleDriveService.backupData(userId);
  }

  @Get('backup/google-drive')
  @ApiOperation({ summary: 'List Google Drive backups' })
  @ApiResponse({ status: 200, description: 'Returns list of backups' })
  async listBackups(@CurrentUser('id') userId: string) {
    return this.googleDriveService.listBackups(userId);
  }

  @Post('backup/google-drive/restore')
  @ApiOperation({ summary: 'Restore data from Google Drive backup' })
  @ApiResponse({ status: 200, description: 'Restore successful' })
  async restoreFromGoogleDrive(
    @CurrentUser('id') userId: string,
    @Body() body: { fileId: string },
  ) {
    await this.googleDriveService.restoreData(userId, body.fileId);
    return { message: 'Data restored successfully' };
  }
}
