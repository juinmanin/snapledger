import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TaxClassificationResult {
  isDeductible: boolean;
  taxCategory: string | null;
  deductionRate: number | null;
  maxAmount: number | null;
  ruleName: string | null;
  confidence: number;
}

@Injectable()
export class TaxEngineService {
  private readonly logger = new Logger(TaxEngineService.name);

  constructor(private prisma: PrismaService) {}

  async loadTaxRulesForCountry(countryId: string) {
    const rules = await this.prisma.taxRule.findMany({
      where: {
        countryId,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      include: {
        country: true,
      },
    });

    return rules;
  }

  async classifyTransaction(
    countryId: string,
    amount: number,
    description: string,
    merchantName?: string,
    categoryName?: string,
    paymentMethod?: string,
  ): Promise<TaxClassificationResult> {
    try {
      const rules = await this.loadTaxRulesForCountry(countryId);

      if (rules.length === 0) {
        return {
          isDeductible: false,
          taxCategory: null,
          deductionRate: null,
          maxAmount: null,
          ruleName: null,
          confidence: 0,
        };
      }

      const matchedRule = this.matchTransactionToRule(
        rules,
        description,
        merchantName,
        categoryName,
        paymentMethod,
      );

      if (!matchedRule) {
        return {
          isDeductible: false,
          taxCategory: null,
          deductionRate: null,
          maxAmount: null,
          ruleName: null,
          confidence: 0.5,
        };
      }

      const deductionRate = this.calculateDeductionRate(matchedRule, amount);

      return {
        isDeductible: true,
        taxCategory: matchedRule.category,
        deductionRate,
        maxAmount: matchedRule.maxAmount,
        ruleName: matchedRule.ruleName,
        confidence: 0.85,
      };
    } catch (error) {
      this.logger.error('Tax classification failed:', error);
      return {
        isDeductible: false,
        taxCategory: null,
        deductionRate: null,
        maxAmount: null,
        ruleName: null,
        confidence: 0,
      };
    }
  }

  private matchTransactionToRule(
    rules: any[],
    description: string,
    merchantName?: string,
    categoryName?: string,
    paymentMethod?: string,
  ): any | null {
    const textToMatch = [
      description?.toLowerCase() || '',
      merchantName?.toLowerCase() || '',
      categoryName?.toLowerCase() || '',
    ].join(' ');

    const categoryKeywords = {
      MEDICAL: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medical', 'health', 'dental', 'medicine', '병원', '약국', '의료'],
      EDUCATION: ['school', 'university', 'tuition', 'course', 'education', '학원', '교육', '수업'],
      TRANSPORT: ['subway', 'bus', 'train', 'metro', 'transport', 'transit', '지하철', '버스', '교통'],
      CREDIT_CARD: ['credit', 'card'],
      DONATIONS: ['donation', 'charity', 'charitable', '기부'],
      INSURANCE: ['insurance', 'premium', '보험'],
      HOUSING: ['mortgage', 'rent', 'housing', 'loan', '주택', '임대'],
      LIFESTYLE: ['gym', 'book', 'sport', 'fitness'],
      CHILDCARE: ['childcare', 'daycare', 'nursery', 'kindergarten'],
      PARENTS_MEDICAL: ['parents', 'parent'],
      CHARITABLE: ['charity', 'donation', 'charitable'],
      MORTGAGE: ['mortgage', 'home loan'],
      STUDENT_LOAN: ['student loan', 'education loan'],
      CHILD_EDUCATION: ['child', 'school'],
      CONTINUING_EDUCATION: ['course', 'training', 'certification'],
      HOUSING_LOAN: ['housing loan', 'home loan'],
      HOUSING_RENT: ['rent', 'rental'],
      ELDERLY_SUPPORT: ['elderly', 'parents', 'senior'],
    };

    for (const rule of rules) {
      const keywords = categoryKeywords[rule.category] || [];
      const hasMatch = keywords.some((keyword) =>
        textToMatch.includes(keyword),
      );

      if (hasMatch) {
        return rule;
      }
    }

    if (paymentMethod && paymentMethod.toLowerCase().includes('credit')) {
      const creditCardRule = rules.find((r) => r.category === 'CREDIT_CARD');
      if (creditCardRule) return creditCardRule;
    }

    return null;
  }

  private calculateDeductionRate(rule: any, amount: number): number {
    if (rule.deductionType === 'RATE') {
      return rule.rate;
    } else if (rule.deductionType === 'FIXED') {
      return rule.maxAmount ? Math.min(amount, rule.maxAmount) / amount : 1.0;
    } else if (rule.deductionType === 'TIERED') {
      return rule.rate;
    }
    return 0;
  }

  async getTaxSeasons(countryId: string) {
    return await this.prisma.taxSeason.findMany({
      where: { countryId },
      orderBy: { periodStart: 'asc' },
    });
  }
}
