import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceiptStatus } from '@prisma/client';

@Injectable()
export class ReceiptsRepository {
  private readonly logger = new Logger(ReceiptsRepository.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.receipt.create({
      data,
      include: {
        items: true,
        transactions: true,
      },
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.receipt.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { category: true },
          orderBy: { sortOrder: 'asc' },
        },
        transactions: true,
      },
    });
  }

  async findMany(userId: string, filters: any) {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.receiptDate = {};
      if (filters.startDate) {
        where.receiptDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.receiptDate.lte = new Date(filters.endDate);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [receipts, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        include: {
          items: {
            include: { category: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.receipt.update({
      where: { id, userId },
      data,
      include: {
        items: {
          include: { category: true },
        },
        transactions: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.receipt.delete({
      where: { id, userId },
    });
  }

  async updateStatus(id: string, status: ReceiptStatus) {
    return this.prisma.receipt.update({
      where: { id },
      data: { status },
    });
  }
}
