import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType, ModeType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  categoryType: CategoryType;

  @ApiProperty({ enum: ModeType, default: ModeType.both })
  @IsEnum(ModeType)
  @IsOptional()
  mode?: ModeType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  taxDeductible?: boolean;
}

export class UpdateCategoryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ListCategoriesQueryDto {
  @ApiProperty({ required: false, enum: CategoryType })
  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType;

  @ApiProperty({ required: false, enum: ModeType })
  @IsEnum(ModeType)
  @IsOptional()
  mode?: ModeType;
}
