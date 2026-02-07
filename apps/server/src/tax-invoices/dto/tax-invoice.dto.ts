import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceType, InvoiceStatus } from '@prisma/client';

export class CreateTaxInvoiceDto {
  @ApiProperty()
  @IsString()
  businessId: string;

  @ApiProperty({ enum: InvoiceType })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty()
  @IsString()
  supplierBizNo: string;

  @ApiProperty()
  @IsString()
  supplierName: string;

  @ApiProperty()
  @IsNumber()
  supplyAmount: number;

  @ApiProperty()
  @IsNumber()
  taxAmount: number;

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isElectronic?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  receiptId?: string;
}

export class UpdateTaxInvoiceDto {
  @ApiProperty({ required: false, enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  supplyAmount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;
}

export class ListTaxInvoicesQueryDto {
  @ApiProperty({ required: false, enum: InvoiceType })
  @IsEnum(InvoiceType)
  @IsOptional()
  type?: InvoiceType;

  @ApiProperty({ required: false, enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
