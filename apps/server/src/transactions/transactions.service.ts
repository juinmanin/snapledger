import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TransactionsRepository } from './repositories/transactions.repository';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ListTransactionsQueryDto,
  TransactionSummaryQueryDto,
} from './dto/transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private repository: TransactionsRepository) {}

  async create(userId: string, dto: CreateTransactionDto) {
    try {
      const transaction = await this.repository.create({
        user: { connect: { id: userId } },
        category: { connect: { id: dto.categoryId } },
        ...(dto.accountId && { account: { connect: { id: dto.accountId } } }),
        transactionType: dto.transactionType,
        amount: new Decimal(dto.amount),
        description: dto.description,
        memo: dto.memo,
        merchantName: dto.merchantName,
        transactionDate: new Date(dto.transactionDate),
        transactionTime: dto.transactionTime,
        tags: dto.tags || [],
        isConfirmed: true,
      });

      this.logger.log(`Transaction created: ${transaction.id}`);

      return transaction;
    } catch (error) {
      this.logger.error(`Create transaction failed: ${error.message}`);
      throw error;
    }
  }

  async list(userId: string, query: ListTransactionsQueryDto) {
    return this.repository.findMany(userId, query);
  }

  async getById(userId: string, transactionId: string) {
    const transaction = await this.repository.findById(transactionId, userId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async update(userId: string, transactionId: string, dto: UpdateTransactionDto) {
    const transaction = await this.repository.findById(transactionId, userId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updateData: any = {};

    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.amount !== undefined) updateData.amount = new Decimal(dto.amount);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.memo !== undefined) updateData.memo = dto.memo;
    if (dto.transactionDate) updateData.transactionDate = new Date(dto.transactionDate);
    if (dto.tags) updateData.tags = dto.tags;

    const updated = await this.repository.update(transactionId, userId, updateData);

    this.logger.log(`Transaction updated: ${transactionId}`);

    return updated;
  }

  async delete(userId: string, transactionId: string) {
    const transaction = await this.repository.findById(transactionId, userId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.repository.softDelete(transactionId, userId);

    this.logger.log(`Transaction soft deleted: ${transactionId}`);

    return { message: 'Transaction deleted successfully' };
  }

  async getSummary(userId: string, query: TransactionSummaryQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.repository.getSummary(userId, startDate, endDate);
  }
}
