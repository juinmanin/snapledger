import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
