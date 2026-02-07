import { IsOptional, IsString } from 'class-validator';

export class ApproveEntryDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectEntryDto {
  @IsString()
  note: string;
}
