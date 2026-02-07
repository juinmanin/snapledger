import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaxSeederService implements OnModuleInit {
  private readonly logger = new Logger(TaxSeederService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedTaxData();
  }

  async seedTaxData() {
    try {
      const existingCountries = await this.prisma.country.count();
      if (existingCountries > 0) {
        this.logger.log('Tax data already seeded');
        return;
      }

      this.logger.log('Seeding tax data...');

      // Korea (KR)
      await this.prisma.country.create({
        data: {
          id: 'KR',
          name: 'South Korea',
          currency: 'KRW',
          vatRate: 0.1,
          vatName: 'VAT',
          taxYearStartMonth: 1,
        },
      });

      await this.seedKoreaTaxRules();
      await this.seedKoreaTaxSeasons();

      // Malaysia (MY)
      await this.prisma.country.create({
        data: {
          id: 'MY',
          name: 'Malaysia',
          currency: 'MYR',
          vatRate: 0.0,
          vatName: 'SST',
          taxYearStartMonth: 1,
        },
      });

      await this.seedMalaysiaTaxRules();
      await this.seedMalaysiaTaxSeasons();

      // USA (US)
      await this.prisma.country.create({
        data: {
          id: 'US',
          name: 'United States',
          currency: 'USD',
          vatRate: 0.0,
          vatName: 'Sales Tax',
          taxYearStartMonth: 1,
        },
      });

      await this.seedUSATaxRules();
      await this.seedUSATaxSeasons();

      // China (CN)
      await this.prisma.country.create({
        data: {
          id: 'CN',
          name: 'China',
          currency: 'CNY',
          vatRate: 0.13,
          vatName: 'VAT',
          taxYearStartMonth: 1,
        },
      });

      await this.seedChinaTaxRules();
      await this.seedChinaTaxSeasons();

      this.logger.log('Tax data seeding completed');
    } catch (error) {
      this.logger.error('Failed to seed tax data:', error);
    }
  }

  private async seedKoreaTaxRules() {
    const rules = [
      {
        countryId: 'KR',
        category: 'MEDICAL',
        ruleName: 'Medical Expense Deduction',
        description: '15% of medical expenses exceeding 3% of total salary',
        deductionType: 'RATE',
        rate: 0.15,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'EDUCATION',
        ruleName: 'Education Expense Deduction',
        description: '15% of education expenses',
        deductionType: 'RATE',
        rate: 0.15,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'TRANSPORT',
        ruleName: 'Public Transport Deduction',
        description: '40% of public transport expenses',
        deductionType: 'RATE',
        rate: 0.4,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['CARD_STATEMENT', 'RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'CREDIT_CARD',
        ruleName: 'Credit Card Usage Deduction',
        description: 'Credit card spending deduction',
        deductionType: 'RATE',
        rate: 0.15,
        maxAmount: 3000000,
        minThreshold: null,
        evidenceRequired: ['CARD_STATEMENT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'DONATIONS',
        ruleName: 'Charitable Donations Deduction',
        description: '15-30% of donations',
        deductionType: 'RATE',
        rate: 0.15,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['DONATION_RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'INSURANCE',
        ruleName: 'Insurance Premium Deduction',
        description: '12% of insurance premiums',
        deductionType: 'RATE',
        rate: 0.12,
        maxAmount: 1000000,
        minThreshold: null,
        evidenceRequired: ['INSURANCE_STATEMENT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'KR',
        category: 'HOUSING',
        ruleName: 'Housing Loan Interest Deduction',
        description: 'Deduction for housing loan interest',
        deductionType: 'RATE',
        rate: 0.3,
        maxAmount: 3000000,
        minThreshold: null,
        evidenceRequired: ['LOAN_STATEMENT'],
        effectiveFrom: new Date('2024-01-01'),
      },
    ];

    for (const rule of rules) {
      await this.prisma.taxRule.create({ data: rule });
    }
  }

  private async seedKoreaTaxSeasons() {
    await this.prisma.taxSeason.create({
      data: {
        countryId: 'KR',
        name: 'Year-End Tax Settlement',
        type: 'YEAR_END_TAX',
        periodStart: '01-01',
        periodEnd: '12-31',
        filingStart: '01-15',
        filingDeadline: '02-28',
        reminderDays: [30, 14, 7, 1],
      },
    });

    await this.prisma.taxSeason.create({
      data: {
        countryId: 'KR',
        name: 'Comprehensive Income Tax',
        type: 'INCOME_TAX',
        periodStart: '01-01',
        periodEnd: '12-31',
        filingStart: '05-01',
        filingDeadline: '05-31',
        reminderDays: [30, 14, 7, 1],
      },
    });
  }

  private async seedMalaysiaTaxRules() {
    const rules = [
      {
        countryId: 'MY',
        category: 'MEDICAL',
        ruleName: 'Medical Relief',
        description: 'Up to RM10,000 for medical expenses',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 10000,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'MY',
        category: 'EDUCATION',
        ruleName: 'Education Relief',
        description: 'Up to RM7,000 for self education',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 7000,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'MY',
        category: 'LIFESTYLE',
        ruleName: 'Lifestyle Relief',
        description: 'Up to RM2,500 for lifestyle expenses',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 2500,
        minThreshold: null,
        evidenceRequired: ['RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'MY',
        category: 'INSURANCE',
        ruleName: 'Life Insurance Relief',
        description: 'Up to RM7,000 for life insurance',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 7000,
        minThreshold: null,
        evidenceRequired: ['INSURANCE_STATEMENT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'MY',
        category: 'CHILDCARE',
        ruleName: 'Child Care Relief',
        description: 'Up to RM3,000 for child care',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 3000,
        minThreshold: null,
        evidenceRequired: ['RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'MY',
        category: 'PARENTS_MEDICAL',
        ruleName: 'Parents Medical Relief',
        description: 'Up to RM8,000 for parents medical expenses',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 8000,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
    ];

    for (const rule of rules) {
      await this.prisma.taxRule.create({ data: rule });
    }
  }

  private async seedMalaysiaTaxSeasons() {
    await this.prisma.taxSeason.create({
      data: {
        countryId: 'MY',
        name: 'Income Tax Filing',
        type: 'INCOME_TAX',
        periodStart: '01-01',
        periodEnd: '12-31',
        filingStart: '03-01',
        filingDeadline: '04-30',
        reminderDays: [30, 14, 7, 1],
      },
    });
  }

  private async seedUSATaxRules() {
    const rules = [
      {
        countryId: 'US',
        category: 'MEDICAL',
        ruleName: 'Medical Expense Deduction',
        description: 'Medical expenses exceeding 7.5% of AGI',
        deductionType: 'TIERED',
        rate: 0.075,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'US',
        category: 'CHARITABLE',
        ruleName: 'Charitable Contribution Deduction',
        description: 'Charitable donations up to 60% of AGI',
        deductionType: 'RATE',
        rate: 0.6,
        maxAmount: null,
        minThreshold: null,
        evidenceRequired: ['DONATION_RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'US',
        category: 'MORTGAGE',
        ruleName: 'Mortgage Interest Deduction',
        description: 'Interest on mortgage debt',
        deductionType: 'RATE',
        rate: 1.0,
        maxAmount: 750000,
        minThreshold: null,
        evidenceRequired: ['1098_FORM'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'US',
        category: 'STUDENT_LOAN',
        ruleName: 'Student Loan Interest Deduction',
        description: 'Up to $2,500 in student loan interest',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 2500,
        minThreshold: null,
        evidenceRequired: ['1098E_FORM'],
        effectiveFrom: new Date('2024-01-01'),
      },
    ];

    for (const rule of rules) {
      await this.prisma.taxRule.create({ data: rule });
    }
  }

  private async seedUSATaxSeasons() {
    await this.prisma.taxSeason.create({
      data: {
        countryId: 'US',
        name: 'Federal Income Tax',
        type: 'INCOME_TAX',
        periodStart: '01-01',
        periodEnd: '12-31',
        filingStart: '01-01',
        filingDeadline: '04-15',
        reminderDays: [60, 30, 14, 7, 1],
      },
    });
  }

  private async seedChinaTaxRules() {
    const rules = [
      {
        countryId: 'CN',
        category: 'CHILD_EDUCATION',
        ruleName: 'Child Education Special Deduction',
        description: '¥2,000 per month per child for education',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 24000,
        minThreshold: null,
        evidenceRequired: ['CERTIFICATE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'CN',
        category: 'CONTINUING_EDUCATION',
        ruleName: 'Continuing Education Special Deduction',
        description: '¥400 per month for continuing education',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 4800,
        minThreshold: null,
        evidenceRequired: ['CERTIFICATE', 'RECEIPT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'CN',
        category: 'MEDICAL',
        ruleName: 'Serious Illness Medical Special Deduction',
        description: 'Medical expenses exceeding threshold, max ¥80,000',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 80000,
        minThreshold: 15000,
        evidenceRequired: ['MEDICAL_RECEIPT', 'INVOICE'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'CN',
        category: 'HOUSING_LOAN',
        ruleName: 'Housing Loan Interest Special Deduction',
        description: '¥1,000 per month for first home loan interest',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 12000,
        minThreshold: null,
        evidenceRequired: ['LOAN_STATEMENT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'CN',
        category: 'HOUSING_RENT',
        ruleName: 'Housing Rent Special Deduction',
        description: '¥800-¥1,500 per month based on city tier',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 18000,
        minThreshold: null,
        evidenceRequired: ['RENTAL_CONTRACT'],
        effectiveFrom: new Date('2024-01-01'),
      },
      {
        countryId: 'CN',
        category: 'ELDERLY_SUPPORT',
        ruleName: 'Elderly Support Special Deduction',
        description: '¥3,000 per month for supporting elderly parents (60+)',
        deductionType: 'FIXED',
        rate: null,
        maxAmount: 36000,
        minThreshold: null,
        evidenceRequired: ['ID_PROOF'],
        effectiveFrom: new Date('2024-01-01'),
      },
    ];

    for (const rule of rules) {
      await this.prisma.taxRule.create({ data: rule });
    }
  }

  private async seedChinaTaxSeasons() {
    await this.prisma.taxSeason.create({
      data: {
        countryId: 'CN',
        name: 'Annual IIT Reconciliation',
        type: 'INCOME_TAX',
        periodStart: '01-01',
        periodEnd: '12-31',
        filingStart: '03-01',
        filingDeadline: '06-30',
        reminderDays: [60, 30, 14, 7, 1],
      },
    });
  }
}
