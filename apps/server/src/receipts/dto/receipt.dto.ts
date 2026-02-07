import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReceiptStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class ScanReceiptDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  image: any;
}

export class ConfirmReceiptDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  merchantName?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  receiptDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class ListReceiptsQueryDto {
  @ApiProperty({ required: false, enum: ReceiptStatus })
  @IsEnum(ReceiptStatus)
  @IsOptional()
  status?: ReceiptStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
