import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ImagePreprocessorService } from './image-preprocessor.service';
import { OcrService } from './ocr.service';
import { AiClassifierService } from './ai-classifier.service';
import * as Minio from 'minio';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReceiptProcessorService {
  private readonly logger = new Logger(ReceiptProcessorService.name);
  private minioClient: Minio.Client;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private imagePreprocessor: ImagePreprocessorService,
    private ocrService: OcrService,
    private aiClassifier: AiClassifierService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async processReceipt(userId: string, imageBuffer: Buffer, originalFilename: string) {
    const receiptId = await this.createInitialReceipt(userId);

    try {
      // Stage 1: Preprocess image
      this.logger.log(`[${receiptId}] Stage 1: Preprocessing image`);
      const preprocessedImage = await this.imagePreprocessor.preprocess(imageBuffer);

      // Stage 2: Upload to S3/MinIO
      this.logger.log(`[${receiptId}] Stage 2: Uploading to storage`);
      const { imageUrl, thumbnailUrl } = await this.uploadImages(receiptId, preprocessedImage);
      await this.updateReceipt(receiptId, { imageUrl, thumbnailUrl });

      // Stage 3: OCR
      this.logger.log(`[${receiptId}] Stage 3: Performing OCR`);
      const ocrText = await this.ocrService.extractText(preprocessedImage);
      await this.updateReceipt(receiptId, { ocrRawText: ocrText });

      // Stage 4: Parse structure
      this.logger.log(`[${receiptId}] Stage 4: Parsing receipt structure`);
      const parsedData = this.parseReceiptText(ocrText);
      await this.updateReceipt(receiptId, parsedData);

      // Stage 5: AI classify
      this.logger.log(`[${receiptId}] Stage 5: AI classification`);
      const { categoryId, confidence } = await this.aiClassifier.classifyReceipt(
        userId,
        parsedData.merchantName || '',
        parsedData.items || [],
        parsedData.totalAmount || 0,
      );

      // Stage 6: Save receipt items
      this.logger.log(`[${receiptId}] Stage 6: Saving receipt items`);
      if (parsedData.items && parsedData.items.length > 0) {
        await this.saveReceiptItems(receiptId, parsedData.items, categoryId);
      }

      // Stage 7: Create draft transaction
      this.logger.log(`[${receiptId}] Stage 7: Creating draft transaction`);
      await this.createDraftTransaction(userId, receiptId, categoryId, parsedData);

      // Update status to parsed
      await this.updateReceipt(receiptId, {
        status: 'parsed',
        aiConfidence: new Decimal(confidence),
      });

      this.logger.log(`[${receiptId}] Receipt processing completed successfully`);

      return await this.prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
          items: { include: { category: true } },
          transactions: true,
        },
      });
    } catch (error) {
      this.logger.error(`[${receiptId}] Processing failed: ${error.message}`, error.stack);
      await this.updateReceipt(receiptId, { status: 'failed' });
      throw error;
    }
  }

  private async createInitialReceipt(userId: string) {
    const receipt = await this.prisma.receipt.create({
      data: {
        userId,
        imageUrl: '',
        status: 'processing',
      },
    });
    return receipt.id;
  }

  private async updateReceipt(receiptId: string, data: any) {
    return this.prisma.receipt.update({
      where: { id: receiptId },
      data,
    });
  }

  private async uploadImages(receiptId: string, imageBuffer: Buffer) {
    const bucket = this.configService.get<string>('MINIO_BUCKET', 'receipts');

    try {
      await this.minioClient.bucketExists(bucket);
    } catch {
      await this.minioClient.makeBucket(bucket, 'us-east-1');
    }

    // Upload main image
    const webpImage = await this.imagePreprocessor.convertToWebP(imageBuffer);
    const imagePath = `receipts/${receiptId}/original.webp`;
    await this.minioClient.putObject(bucket, imagePath, webpImage, webpImage.length, {
      'Content-Type': 'image/webp',
    } as any);

    // Upload thumbnail
    const thumbnail = await this.imagePreprocessor.createThumbnail(imageBuffer);
    const thumbnailPath = `receipts/${receiptId}/thumbnail.webp`;
    await this.minioClient.putObject(bucket, thumbnailPath, thumbnail, thumbnail.length, {
      'Content-Type': 'image/webp',
    } as any);

    const imageUrl = `${this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000')}/${bucket}/${imagePath}`;
    const thumbnailUrl = `${this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000')}/${bucket}/${thumbnailPath}`;

    return { imageUrl, thumbnailUrl };
  }

  private parseReceiptText(text: string): any {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l);

    const result: any = {
      merchantName: null,
      merchantBizNo: null,
      receiptDate: null,
      receiptTime: null,
      totalAmount: null,
      taxAmount: null,
      paymentMethod: null,
      cardLastFour: null,
      items: [],
    };

    // Extract merchant name (usually first few lines)
    if (lines.length > 0) {
      result.merchantName = lines[0];
    }

    // Extract business number (000-00-00000)
    const bizNoPattern = /(\d{3}-\d{2}-\d{5})/;
    const bizNoMatch = text.match(bizNoPattern);
    if (bizNoMatch) {
      result.merchantBizNo = bizNoMatch[1];
    }

    // Extract date (YYYY-MM-DD or YYYY/MM/DD or YYYYMMDD)
    const datePattern = /(\d{4}[-/.년]\s?\d{1,2}[-/.월]\s?\d{1,2}[일]?)/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      const dateStr = dateMatch[1].replace(/[년월일\s]/g, '-').replace(/\//g, '-');
      try {
        result.receiptDate = new Date(dateStr);
      } catch (e) {
        this.logger.warn(`Failed to parse date: ${dateMatch[1]}`);
      }
    }

    // Extract time (HH:MM:SS or HH:MM)
    const timePattern = /(\d{1,2}:\d{2}(?::\d{2})?)/;
    const timeMatch = text.match(timePattern);
    if (timeMatch) {
      result.receiptTime = timeMatch[1];
    }

    // Extract amounts
    const amountPattern = /(?:합계|총액|금액|결제).*?[:\s]*([\d,]+)\s*원?/i;
    const amountMatch = text.match(amountPattern);
    if (amountMatch) {
      result.totalAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    const taxPattern = /(?:부가세|VAT).*?[:\s]*([\d,]+)\s*원?/i;
    const taxMatch = text.match(taxPattern);
    if (taxMatch) {
      result.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''));
    }

    // Extract payment method
    if (text.includes('카드') || text.includes('card')) {
      result.paymentMethod = '카드';
      const cardPattern = /(\d{4}[-*]\d{4}[-*]\d{4}[-*](\d{4}))/;
      const cardMatch = text.match(cardPattern);
      if (cardMatch) {
        result.cardLastFour = cardMatch[2];
      }
    } else if (text.includes('현금') || text.includes('cash')) {
      result.paymentMethod = '현금';
    }

    // Extract items (simple approach - look for patterns like "item name quantity price")
    const itemPattern = /^([가-힣a-zA-Z0-9\s]+)\s+(\d+)\s+([\d,]+)$/;
    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        result.items.push({
          name: match[1].trim(),
          quantity: parseInt(match[2]),
          price: parseFloat(match[3].replace(/,/g, '')),
        });
      }
    }

    return result;
  }

  private async saveReceiptItems(receiptId: string, items: any[], categoryId: string) {
    for (const [index, item] of items.entries()) {
      await this.prisma.receiptItem.create({
        data: {
          receiptId,
          itemName: item.name,
          quantity: new Decimal(item.quantity || 1),
          unitPrice: new Decimal(item.price || 0),
          totalPrice: new Decimal((item.quantity || 1) * (item.price || 0)),
          categoryId,
          sortOrder: index,
        },
      });
    }
  }

  private async createDraftTransaction(
    userId: string,
    receiptId: string,
    categoryId: string,
    parsedData: any,
  ) {
    if (!parsedData.totalAmount) {
      this.logger.warn('No total amount found, skipping transaction creation');
      return;
    }

    await this.prisma.transaction.create({
      data: {
        userId,
        receiptId,
        categoryId,
        transactionType: 'expense',
        amount: new Decimal(parsedData.totalAmount),
        merchantName: parsedData.merchantName,
        transactionDate: parsedData.receiptDate || new Date(),
        transactionTime: parsedData.receiptTime,
        isConfirmed: false,
        description: `Receipt - Auto-generated from ${parsedData.merchantName || 'Unknown merchant'}`,
      },
    });
  }
}
