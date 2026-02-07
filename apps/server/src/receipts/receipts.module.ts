import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptProcessorService } from './services/receipt-processor.service';
import { OcrService } from './services/ocr.service';
import { AiClassifierService } from './services/ai-classifier.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ReceiptsController],
  providers: [
    ReceiptProcessorService,
    OcrService,
    AiClassifierService,
    PrismaService,
  ],
  exports: [ReceiptProcessorService],
})
export class ReceiptsModule {}
