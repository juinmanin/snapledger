import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { OcrService } from './ocr.service';
import { AiClassifierService } from './ai-classifier.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ReceiptProcessorService {
  private readonly logger = new Logger(ReceiptProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private ocrService: OcrService,
    private aiClassifier: AiClassifierService,
  ) {}

  async processReceipt(
    file: Express.Multer.File,
    userId: string,
  ): Promise<any> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `receipts/${userId}/${randomUUID()}.${fileExtension}`;

      const imagePath = await this.storageService.upload(
        file.buffer,
        fileName,
        file.mimetype,
      );

      const ocrResult = await this.ocrService.extractText(file.buffer);
      this.logger.log(
        `OCR completed: provider=${ocrResult.provider}, confidence=${ocrResult.confidence}`,
      );

      const parsedData = await this.aiClassifier.parseReceiptText(ocrResult.text);
      this.logger.log(
        `AI classification completed: merchant=${parsedData.merchantName}, amount=${parsedData.totalAmount}`,
      );

      const receipt = await this.prisma.receipt.create({
        data: {
          userId,
          imagePath,
          ocrText: ocrResult.text,
          ocrConfidence: ocrResult.confidence,
          ocrProvider: ocrResult.provider,
          merchantName: parsedData.merchantName,
          merchantAddress: parsedData.merchantAddress,
          merchantPhone: parsedData.merchantPhone,
          totalAmount: parsedData.totalAmount,
          subtotal: parsedData.subtotal,
          tax: parsedData.tax,
          tip: parsedData.tip,
          date: new Date(parsedData.date),
          time: parsedData.time,
          paymentMethod: parsedData.paymentMethod,
          suggestedCategory: parsedData.suggestedCategory,
          aiConfidence: parsedData.confidence,
          status: parsedData.confidence > 0.7 ? 'PROCESSED' : 'NEEDS_REVIEW',
        },
      });

      if (parsedData.items && parsedData.items.length > 0) {
        await this.prisma.receiptItem.createMany({
          data: parsedData.items.map((item) => ({
            receiptId: receipt.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }

      if (parsedData.confidence > 0.7) {
        const category = await this.prisma.category.findFirst({
          where: {
            userId,
            name: parsedData.suggestedCategory,
          },
        });

        if (category) {
          await this.prisma.transaction.create({
            data: {
              userId,
              receiptId: receipt.id,
              categoryId: category.id,
              amount: parsedData.totalAmount,
              description: `${parsedData.merchantName} - Auto-generated`,
              date: new Date(parsedData.date),
              type: 'EXPENSE',
              paymentMethod: parsedData.paymentMethod,
            },
          });
        }
      }

      return {
        receipt,
        parsed: parsedData,
        ocr: {
          confidence: ocrResult.confidence,
          provider: ocrResult.provider,
        },
      };
    } catch (error) {
      this.logger.error('Receipt processing failed:', error);
      throw error;
    }
  }
}
