import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateBatchItemDto {
  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  taxCategory?: string;

  @IsOptional()
  @IsBoolean()
  deductible?: boolean;
}
