import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class ClassifyTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
