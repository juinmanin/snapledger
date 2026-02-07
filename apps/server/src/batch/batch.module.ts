import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchUploadService } from './services/batch-upload.service';
import { BatchProcessorService } from './services/batch-processor.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { ReceiptsModule } from '../receipts/receipts.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [ReceiptsModule, TaxModule],
  controllers: [BatchController],
  providers: [
    BatchUploadService,
    BatchProcessorService,
    PrismaService,
  ],
  exports: [BatchUploadService],
})
export class BatchModule {}
