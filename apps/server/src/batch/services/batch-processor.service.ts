import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { ReceiptProcessorService } from '../../receipts/services/receipt-processor.service';
import { OcrService } from '../../receipts/services/ocr.service';
import { AiClassifierService } from '../../receipts/services/ai-classifier.service';
import { TaxEngineService } from '../../tax/services/tax-engine.service';
import { randomUUID } from 'crypto';

@Injectable()
export class BatchProcessorService {
  private readonly logger = new Logger(BatchProcessorService.name);
  private readonly MAX_PARALLEL = 3;
  private readonly MAX_RETRIES = 2;

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private ocrService: OcrService,
    private aiClassifier: AiClassifierService,
    private taxEngine: TaxEngineService,
  ) {}

  async processBatchAsync(batchId: string) {
    setImmediate(async () => {
      try {
        await this.processBatch(batchId);
      } catch (error) {
        this.logger.error(`Batch processing failed for ${batchId}:`, error);
      }
    });
  }

  private async processBatch(batchId: string) {
    try {
      this.logger.log(`Starting batch processing for ${batchId}`);

      const batch = await this.prisma.batchUpload.findUnique({
        where: { id: batchId },
        include: { items: true },
      });

      if (!batch) {
        throw new Error('Batch not found');
      }

      const pendingItems = batch.items
        .filter((item) => item.status === 'PENDING')
        .sort((a, b) => a.order - b.order);

      for (let i = 0; i < pendingItems.length; i += this.MAX_PARALLEL) {
        const chunk = pendingItems.slice(i, i + this.MAX_PARALLEL);
        await Promise.all(
          chunk.map((item) => this.processItem(item, batch.userId)),
        );
      }

      this.logger.log(`Batch processing completed for ${batchId}`);
    } catch (error) {
      this.logger.error(`Batch processing error for ${batchId}:`, error);
    }
  }

  private async processItem(item: any, userId: string, retryCount = 0) {
    try {
      await this.prisma.batchUploadItem.update({
        where: { id: item.id },
        data: { status: 'PROCESSING' },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { country: true },
      });

      const countryId = user?.country || 'KR';

      // Note: File buffer should be retrieved from storage or passed through the batch system
      // This is a placeholder that needs to be implemented with actual file retrieval
      const fileBuffer = Buffer.from([]);
      this.logger.warn(`Processing item ${item.id} - file buffer retrieval not implemented`);

      const ocrResult = await this.ocrService.extractText(fileBuffer);
      
      const parsedData = await this.aiClassifier.parseReceiptText(ocrResult.text);

      const taxResult = await this.taxEngine.classifyTransaction(
        countryId,
        parsedData.totalAmount,
        item.originalFilename,
        parsedData.merchantName,
        parsedData.suggestedCategory,
        parsedData.paymentMethod,
      );

      await this.prisma.batchUploadItem.update({
        where: { id: item.id },
        data: {
          merchantName: parsedData.merchantName,
          amount: parsedData.totalAmount,
          currency: 'KRW',
          date: new Date(parsedData.date),
          category: parsedData.suggestedCategory,
          taxCategory: taxResult.taxCategory,
          deductible: taxResult.isDeductible,
          confidence: parsedData.confidence,
          status: 'SUCCESS',
        },
      });

      await this.updateBatchCounts(item.batchId);

      this.logger.log(`Item ${item.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process item ${item.id}:`, error);

      if (retryCount < this.MAX_RETRIES) {
        this.logger.log(`Retrying item ${item.id}, attempt ${retryCount + 1}`);
        await this.processItem(item, userId, retryCount + 1);
      } else {
        await this.prisma.batchUploadItem.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'Processing failed',
          },
        });
        await this.updateBatchCounts(item.batchId);
      }
    }
  }

  async createReceiptAndTransaction(item: any, userId: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          userId,
          name: item.category,
        },
      });

      const receipt = await this.prisma.receipt.create({
        data: {
          userId,
          originalFilename: item.originalFilename,
          storagePath: `receipts/${userId}/${randomUUID()}.jpg`,
          storageUrl: null,
          fileSize: 0,
          mimeType: 'image/jpeg',
          ocrText: '',
          ocrConfidence: item.confidence,
          ocrProvider: 'batch-processor',
          merchantName: item.merchantName,
          totalAmount: item.amount,
          currency: item.currency || 'KRW',
          transactionDate: item.date,
          suggestedCategoryId: category?.id,
          classificationConfidence: item.confidence,
          status: 'completed',
          processedAt: new Date(),
        },
      });

      if (category) {
        await this.prisma.transaction.create({
          data: {
            userId,
            receiptId: receipt.id,
            categoryId: category.id,
            amount: item.amount,
            currency: item.currency || 'KRW',
            merchantName: item.merchantName,
            description: `${item.merchantName} - Batch processed`,
            date: item.date,
            type: 'expense',
            isDeductible: item.deductible || false,
            taxCategory: item.taxCategory,
            confirmed: true,
          },
        });
      }

      await this.prisma.batchUploadItem.update({
        where: { id: item.id },
        data: { receiptId: receipt.id },
      });

      this.logger.log(`Receipt and transaction created for item ${item.id}`);
    } catch (error) {
      this.logger.error(`Failed to create receipt for item ${item.id}:`, error);
      throw error;
    }
  }

  private async updateBatchCounts(batchId: string) {
    const items = await this.prisma.batchUploadItem.findMany({
      where: { batchId },
    });

    const processedCount = items.filter(
      (i) => i.status !== 'PENDING' && i.status !== 'PROCESSING',
    ).length;
    const successCount = items.filter((i) => i.status === 'SUCCESS').length;
    const failedCount = items.filter((i) => i.status === 'FAILED').length;

    await this.prisma.batchUpload.update({
      where: { id: batchId },
      data: {
        processedCount,
        successCount,
        failedCount,
      },
    });
  }
}
