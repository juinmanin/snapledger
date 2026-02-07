import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { GoogleSheetsService } from '../integrations/google-sheets.service';
import { GoogleDriveService } from '../integrations/google-drive.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    GoogleSheetsService,
    GoogleDriveService,
    PrismaService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
