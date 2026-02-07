import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxInvoiceDto, UpdateTaxInvoiceDto, ListTaxInvoicesQueryDto } from './dto/tax-invoice.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TaxInvoicesService {
  private readonly logger = new Logger(TaxInvoicesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaxInvoiceDto) {
    try {
      // Verify business ownership
      const business = await this.prisma.business.findFirst({
        where: { id: dto.businessId, ownerId: userId },
      });

      if (!business) {
        throw new ForbiddenException('Business not found or access denied');
      }

      const taxInvoice = await this.prisma.taxInvoice.create({
        data: {
          businessId: dto.businessId,
          invoiceType: dto.invoiceType,
          invoiceNumber: dto.invoiceNumber,
          supplierBizNo: dto.supplierBizNo,
          supplierName: dto.supplierName,
          supplyAmount: new Decimal(dto.supplyAmount),
          taxAmount: new Decimal(dto.taxAmount),
          totalAmount: new Decimal(dto.totalAmount),
          invoiceDate: new Date(dto.invoiceDate),
          isElectronic: dto.isElectronic || false,
          receiptId: dto.receiptId,
          status: 'pending',
        },
        include: {
          business: true,
          receipt: true,
        },
      });

      this.logger.log(`Tax invoice created: ${taxInvoice.id}`);

      return taxInvoice;
    } catch (error) {
      this.logger.error(`Create tax invoice failed: ${error.message}`);
      throw error;
    }
  }

  async list(userId: string, businessId: string, query: ListTaxInvoicesQueryDto) {
    // Verify business ownership
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId: userId },
    });

    if (!business) {
      throw new ForbiddenException('Business not found or access denied');
    }

    const where: any = { businessId };

    if (query.type) {
      where.invoiceType = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.invoiceDate = {};
      if (query.startDate) {
        where.invoiceDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.invoiceDate.lte = new Date(query.endDate);
      }
    }

    const invoices = await this.prisma.taxInvoice.findMany({
      where,
      include: {
        business: true,
        receipt: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices;
  }

  async getById(userId: string, invoiceId: string) {
    const invoice = await this.prisma.taxInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        business: true,
        receipt: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Tax invoice not found');
    }

    // Verify ownership
    if (invoice.business.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return invoice;
  }

  async update(userId: string, invoiceId: string, dto: UpdateTaxInvoiceDto) {
    const invoice = await this.getById(userId, invoiceId);

    const updateData: any = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.invoiceNumber) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.supplyAmount !== undefined) updateData.supplyAmount = new Decimal(dto.supplyAmount);
    if (dto.taxAmount !== undefined) updateData.taxAmount = new Decimal(dto.taxAmount);
    if (dto.totalAmount !== undefined) updateData.totalAmount = new Decimal(dto.totalAmount);

    const updated = await this.prisma.taxInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        business: true,
        receipt: true,
      },
    });

    this.logger.log(`Tax invoice updated: ${invoiceId}`);

    return updated;
  }

  async delete(userId: string, invoiceId: string) {
    await this.getById(userId, invoiceId);

    await this.prisma.taxInvoice.delete({
      where: { id: invoiceId },
    });

    this.logger.log(`Tax invoice deleted: ${invoiceId}`);

    return { message: 'Tax invoice deleted successfully' };
  }
}
