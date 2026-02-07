import { IsString, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsDateString()
  date: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  receiptId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
