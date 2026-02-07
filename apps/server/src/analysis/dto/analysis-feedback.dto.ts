import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AnalysisFeedbackDto {
  @IsString()
  feedback: string;

  @IsOptional()
  @IsBoolean()
  helpful?: boolean;
}
