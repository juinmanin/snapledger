import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { DailyAnalysisService } from './services/daily-analysis.service';
import { PatternLearningService } from './services/pattern-learning.service';
import { AnalysisFeedbackDto } from './dto/analysis-feedback.dto';
import { UpdateAnalysisSettingsDto } from './dto/update-analysis-settings.dto';

@ApiTags('analysis')
@Controller('api/v1/analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(
    private prisma: PrismaService,
    private dailyAnalysis: DailyAnalysisService,
    private patternLearning: PatternLearningService,
  ) {}

  @Get('daily')
  @ApiOperation({ summary: "Get today's analysis" })
  @ApiResponse({ status: 200, description: "Returns today's analysis" })
  async getTodaysAnalysis(@CurrentUser('id') userId: string) {
    const analysis = await this.dailyAnalysis.getDailyAnalysis(userId);
    
    if (!analysis) {
      return {
        message: 'No analysis available yet. Run manual analysis or wait for scheduled time.',
      };
    }
    
    return analysis;
  }

  @Get('daily/:date')
  @ApiOperation({ summary: 'Get analysis for specific date' })
  @ApiResponse({ status: 200, description: 'Returns analysis for date' })
  async getAnalysisByDate(
    @CurrentUser('id') userId: string,
    @Param('date') dateStr: string,
  ) {
    const date = new Date(dateStr);
    const analysis = await this.dailyAnalysis.getDailyAnalysis(userId, date);
    
    if (!analysis) {
      return {
        message: 'No analysis available for this date.',
      };
    }
    
    return analysis;
  }

  @Post('daily/:id/feedback')
  @ApiOperation({ summary: 'Submit feedback for analysis' })
  @ApiResponse({ status: 200, description: 'Feedback submitted' })
  async submitFeedback(
    @CurrentUser('id') userId: string,
    @Param('id') analysisId: string,
    @Body() dto: AnalysisFeedbackDto,
  ) {
    await this.dailyAnalysis.submitFeedback(userId, analysisId, dto.feedback);
    return { message: 'Feedback submitted successfully' };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get analysis settings' })
  @ApiResponse({ status: 200, description: 'Returns analysis settings' })
  async getSettings(@CurrentUser('id') userId: string) {
    const settings = await this.prisma.analysisSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return await this.prisma.analysisSettings.create({
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

  @Put('settings')
  @ApiOperation({ summary: 'Update analysis settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAnalysisSettingsDto,
  ) {
    const settings = await this.prisma.analysisSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });

    return settings;
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get user spending patterns' })
  @ApiResponse({ status: 200, description: 'Returns user patterns' })
  async getPatterns(@CurrentUser('id') userId: string) {
    const patterns = await this.patternLearning.getUserPatterns(userId);
    return patterns;
  }

  @Post('run')
  @ApiOperation({ summary: 'Manually trigger analysis' })
  @ApiResponse({ status: 200, description: 'Analysis triggered' })
  async runManualAnalysis(@CurrentUser('id') userId: string) {
    const analysis = await this.dailyAnalysis.analyzeDailyTransactions(userId);
    await this.patternLearning.updateUserPatterns(userId);
    
    return {
      message: 'Analysis completed',
      analysis,
    };
  }
}
