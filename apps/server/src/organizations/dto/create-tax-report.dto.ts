import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateTaxReportDto {
  @IsString()
  @IsNotEmpty()
  period: string;

  @IsEnum(['MONTHLY', 'QUARTERLY', 'YEARLY_INCOME_TAX', 'YEARLY_VAT'])
  type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY_INCOME_TAX' | 'YEARLY_VAT';
}
