import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportQueryDto } from './dto/report.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('income-expense')
  @ApiOperation({ summary: 'Get income and expense report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getIncomeExpenseReport(
    @CurrentUser('id') userId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getIncomeExpenseReport(userId, query);
  }

  @Get('tax-summary')
  @ApiOperation({ summary: 'Get tax summary report' })
  @ApiResponse({ status: 200, description: 'Tax summary retrieved successfully' })
  async getTaxSummary(
    @CurrentUser('id') userId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getTaxSummary(userId, query);
  }
}
