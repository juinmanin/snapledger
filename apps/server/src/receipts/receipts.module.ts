import { Module } from '@nestjs/common';
import { ReceiptsController } from './receipts.controller';
import { ReceiptsService } from './receipts.service';
import { ReceiptsRepository } from './repositories/receipts.repository';
import { ImagePreprocessorService } from './services/image-preprocessor.service';
import { OcrService } from './services/ocr.service';
import { AiClassifierService } from './services/ai-classifier.service';
import { UserLearningService } from './services/user-learning.service';
import { ReceiptProcessorService } from './services/receipt-processor.service';

@Module({
  controllers: [ReceiptsController],
  providers: [
    ReceiptsService,
    ReceiptsRepository,
    ImagePreprocessorService,
    OcrService,
    AiClassifierService,
    UserLearningService,
    ReceiptProcessorService,
  ],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
