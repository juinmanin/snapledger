import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
