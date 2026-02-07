import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(['ADMIN', 'ACCOUNTANT', 'MEMBER'])
  role: 'ADMIN' | 'ACCOUNTANT' | 'MEMBER';

  @IsOptional()
  @IsNumber()
  @Min(0)
  spendingLimit?: number;
}
