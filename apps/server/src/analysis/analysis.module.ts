import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalysisController } from './analysis.controller';
import { DailyAnalysisService } from './services/daily-analysis.service';
import { PatternLearningService } from './services/pattern-learning.service';
import { AnalysisSchedulerService } from './services/analysis-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AnalysisController],
  providers: [
    DailyAnalysisService,
    PatternLearningService,
    AnalysisSchedulerService,
    PrismaService,
  ],
  exports: [DailyAnalysisService, PatternLearningService],
})
export class AnalysisModule {}
