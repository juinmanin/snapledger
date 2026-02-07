import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { BatchProcessorService } from './batch-processor.service';
import { randomUUID } from 'crypto';

@Injectable()
export class BatchUploadService {
  private readonly logger = new Logger(BatchUploadService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private batchProcessor: BatchProcessorService,
  ) {}

  async createBatch(
    userId: string,
    files: Express.Multer.File[],
    name?: string,
  ) {
    try {
      if (files.length > 50) {
        throw new Error('Maximum 50 files allowed per batch');
      }

      const batch = await this.prisma.batchUpload.create({
        data: {
          userId,
          name: name || `Batch ${new Date().toISOString()}`,
          totalCount: files.length,
          status: 'UPLOADING',
        },
      });

      this.logger.log(`Created batch ${batch.id} with ${files.length} files`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await this.createBatchItem(batch.id, file, i);
      }

      await this.prisma.batchUpload.update({
        where: { id: batch.id },
        data: { status: 'PROCESSING' },
      });

      this.batchProcessor.processBatchAsync(batch.id);

      return batch;
    } catch (error) {
      this.logger.error('Batch creation failed:', error);
      throw error;
    }
  }

  private async createBatchItem(
    batchId: string,
    file: Express.Multer.File,
    order: number,
  ) {
    await this.prisma.batchUploadItem.create({
      data: {
        batchId,
        originalFilename: file.originalname,
        order,
        status: 'PENDING',
      },
    });
  }

  async getBatch(batchId: string, userId: string) {
    return await this.prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async listBatches(userId: string) {
    return await this.prisma.batchUpload.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async getBatchItems(batchId: string, userId: string) {
    const batch = await this.prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return await this.prisma.batchUploadItem.findMany({
      where: { batchId },
      orderBy: { order: 'asc' },
    });
  }

  async updateItem(itemId: string, userId: string, updates: any) {
    const item = await this.prisma.batchUploadItem.findFirst({
      where: {
        id: itemId,
        batch: { userId },
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return await this.prisma.batchUploadItem.update({
      where: { id: itemId },
      data: {
        ...updates,
        userEdited: true,
      },
    });
  }

  async approveItem(itemId: string, userId: string) {
    const item = await this.prisma.batchUploadItem.findFirst({
      where: {
        id: itemId,
        batch: { userId },
      },
      include: {
        batch: true,
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status !== 'SUCCESS') {
      throw new Error('Item must be successfully processed before approval');
    }

    await this.batchProcessor.createReceiptAndTransaction(item, userId);

    await this.prisma.batchUploadItem.update({
      where: { id: itemId },
      data: { userApproved: true },
    });

    await this.updateBatchProgress(item.batchId);

    return { message: 'Item approved and receipt created' };
  }

  async approveAllHighConfidence(batchId: string, userId: string) {
    const batch = await this.prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    const highConfidenceItems = batch.items.filter(
      (item) => item.status === 'SUCCESS' && (item.confidence || 0) >= 0.8 && !item.userApproved,
    );

    for (const item of highConfidenceItems) {
      await this.batchProcessor.createReceiptAndTransaction(item, userId);
      await this.prisma.batchUploadItem.update({
        where: { id: item.id },
        data: { userApproved: true },
      });
    }

    await this.updateBatchProgress(batchId);

    return {
      message: `Approved ${highConfidenceItems.length} high-confidence items`,
      count: highConfidenceItems.length,
    };
  }

  async deleteBatch(batchId: string, userId: string) {
    const batch = await this.prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    await this.prisma.batchUpload.update({
      where: { id: batchId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Batch cancelled' };
  }

  async retryFailed(batchId: string, userId: string) {
    const batch = await this.prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId,
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    await this.prisma.batchUploadItem.updateMany({
      where: {
        batchId,
        status: 'FAILED',
      },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });

    this.batchProcessor.processBatchAsync(batchId);

    return { message: 'Retrying failed items' };
  }

  private async updateBatchProgress(batchId: string) {
    const items = await this.prisma.batchUploadItem.findMany({
      where: { batchId },
    });

    const processedCount = items.filter((i) => i.status !== 'PENDING' && i.status !== 'PROCESSING').length;
    const successCount = items.filter((i) => i.status === 'SUCCESS').length;
    const failedCount = items.filter((i) => i.status === 'FAILED').length;

    const allProcessed = processedCount === items.length;
    const allApproved = items.filter((i) => i.status === 'SUCCESS').every((i) => i.userApproved);

    let status = 'PROCESSING';
    if (allProcessed && allApproved) {
      status = 'COMPLETED';
    } else if (allProcessed) {
      status = 'REVIEWING';
    }

    await this.prisma.batchUpload.update({
      where: { id: batchId },
      data: {
        processedCount,
        successCount,
        failedCount,
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });
  }
}
