import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PeriodType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: PeriodType })
  @IsEnum(PeriodType)
  periodType: PeriodType;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false, default: 80 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  alertThreshold?: number;
}

export class UpdateBudgetDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  alertThreshold?: number;
}
