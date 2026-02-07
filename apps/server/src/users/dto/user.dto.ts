import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;
}

export class SwitchModeDto {
  @ApiProperty({ enum: UserType })
  @IsEnum(UserType)
  userType: UserType;
}
