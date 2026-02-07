import { IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListNotificationsQueryDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  unreadOnly?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
