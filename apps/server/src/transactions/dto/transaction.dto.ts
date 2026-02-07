import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  memo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  merchantName?: string;

  @ApiProperty()
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transactionTime?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateTransactionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  memo?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class ListTransactionsQueryDto {
  @ApiProperty({ required: false, enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeDeleted?: boolean = false;

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

export class TransactionSummaryQueryDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
