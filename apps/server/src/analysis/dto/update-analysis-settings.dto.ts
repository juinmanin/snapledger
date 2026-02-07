import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateAnalysisSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  analysisTime?: string;

  @IsOptional()
  @IsString()
  messageStyle?: string;

  @IsOptional()
  @IsBoolean()
  checkMeals?: boolean;

  @IsOptional()
  @IsBoolean()
  checkTransport?: boolean;

  @IsOptional()
  @IsBoolean()
  checkDuplicates?: boolean;

  @IsOptional()
  @IsBoolean()
  checkPatterns?: boolean;

  @IsOptional()
  @IsBoolean()
  skipWeekends?: boolean;

  @IsOptional()
  @IsBoolean()
  skipHolidays?: boolean;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  commuteMethod?: string;

  @IsOptional()
  @IsString()
  workType?: string;
}
