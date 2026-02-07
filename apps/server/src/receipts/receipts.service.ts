import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReceiptsRepository } from './repositories/receipts.repository';
import { ReceiptProcessorService } from './services/receipt-processor.service';
import { UserLearningService } from './services/user-learning.service';
import { ListReceiptsQueryDto, ConfirmReceiptDto } from './dto/receipt.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  constructor(
    private repository: ReceiptsRepository,
    private processor: ReceiptProcessorService,
    private learningService: UserLearningService,
    private prisma: PrismaService,
  ) {}

  async scanReceipt(userId: string, file: Express.Multer.File) {
    this.logger.log(`Scanning receipt for user: ${userId}`);
    return this.processor.processReceipt(userId, file.buffer, file.originalname);
  }

  async listReceipts(userId: string, query: ListReceiptsQueryDto) {
    return this.repository.findMany(userId, query);
  }

  async getReceipt(userId: string, receiptId: string) {
    const receipt = await this.repository.findById(receiptId, userId);
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return receipt;
  }

  async confirmReceipt(userId: string, receiptId: string, dto: ConfirmReceiptDto) {
    const receipt = await this.repository.findById(receiptId, userId);
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    // Update receipt
    const updateData: any = {
      status: 'confirmed',
    };

    if (dto.merchantName) updateData.merchantName = dto.merchantName;
    if (dto.receiptDate) updateData.receiptDate = new Date(dto.receiptDate);
    if (dto.totalAmount) updateData.totalAmount = dto.totalAmount;

    const updatedReceipt = await this.repository.update(receiptId, userId, updateData);

    // Update associated transaction
    if (receipt.transactions.length > 0) {
      const transaction = receipt.transactions[0];
      const txUpdateData: any = {
        isConfirmed: true,
      };

      if (dto.merchantName) txUpdateData.merchantName = dto.merchantName;
      if (dto.receiptDate) txUpdateData.transactionDate = new Date(dto.receiptDate);
      if (dto.totalAmount) txUpdateData.amount = dto.totalAmount;
      if (dto.categoryId) {
        txUpdateData.categoryId = dto.categoryId;

        // Save learning if category changed
        if (transaction.categoryId !== dto.categoryId && receipt.merchantName) {
          await this.learningService.saveCorrection(
            userId,
            receipt.merchantName,
            transaction.categoryId,
            dto.categoryId,
          );
        }
      }

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: txUpdateData,
      });
    }

    this.logger.log(`Receipt confirmed: ${receiptId}`);

    return updatedReceipt;
  }

  async deleteReceipt(userId: string, receiptId: string) {
    const receipt = await this.repository.findById(receiptId, userId);
    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    await this.repository.delete(receiptId, userId);
    this.logger.log(`Receipt deleted: ${receiptId}`);

    return { message: 'Receipt deleted successfully' };
  }
}
