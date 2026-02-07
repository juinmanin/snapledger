import { IsString, IsOptional } from 'class-validator';

export class UploadBatchDto {
  @IsOptional()
  @IsString()
  name?: string;
}
