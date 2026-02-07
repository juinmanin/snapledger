import { IsOptional, IsString } from 'class-validator';

export class UploadReceiptDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
