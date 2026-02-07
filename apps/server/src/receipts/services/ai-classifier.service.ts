import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserLearningService } from './user-learning.service';
import OpenAI from 'openai';

@Injectable()
export class AiClassifierService {
  private readonly logger = new Logger(AiClassifierService.name);
  private openai: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private learningService: UserLearningService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI initialized');
    } else {
      this.logger.warn('OpenAI API key not found');
    }
  }

  async classifyReceipt(
    userId: string,
    merchantName: string,
    items: string[],
    totalAmount: number,
  ): Promise<{ categoryId: string; confidence: number }> {
    try {
      // Step 1: Check user learning patterns
      const learnedCategory = await this.learningService.findSimilarMerchant(userId, merchantName);
      if (learnedCategory) {
        return { categoryId: learnedCategory, confidence: 0.95 };
      }

      // Step 2: Rule-based classification
      const ruleBasedResult = await this.ruleBasedClassification(merchantName, items);
      if (ruleBasedResult.confidence > 0.9) {
        return ruleBasedResult;
      }

      // Step 3: AI classification
      if (this.openai) {
        const aiResult = await this.aiClassification(merchantName, items, totalAmount);
        if (aiResult) {
          return aiResult;
        }
      }

      // Fallback to rule-based result
      return ruleBasedResult;
    } catch (error) {
      this.logger.error(`Classification failed: ${error.message}`);
      return this.getDefaultCategory();
    }
  }

  private async ruleBasedClassification(
    merchantName: string,
    items: string[],
  ): Promise<{ categoryId: string; confidence: number }> {
    const rules = [
      { keywords: ['커피', '카페', '스타벅스', '이디야', '투썸'], category: '식비', confidence: 0.95 },
      { keywords: ['편의점', 'CU', 'GS25', '세븐일레븐', '이마트24'], category: '식비', confidence: 0.9 },
      { keywords: ['버스', '지하철', '택시', '카카오T', '우버'], category: '교통비', confidence: 0.95 },
      { keywords: ['주유소', 'SK주유', 'GS칼텍스', '현대오일뱅크'], category: '교통비', confidence: 0.95 },
      { keywords: ['병원', '약국', '의원', '한의원'], category: '의료/건강', confidence: 0.95 },
      { keywords: ['마트', '이마트', '홈플러스', '롯데마트'], category: '생활용품', confidence: 0.85 },
      { keywords: ['영화관', 'CGV', '롯데시네마', '메가박스'], category: '문화/여가', confidence: 0.95 },
      { keywords: ['헬스장', '피트니스', '요가'], category: '의료/건강', confidence: 0.9 },
      { keywords: ['미용실', '헤어샵', '네일샵'], category: '의류/미용', confidence: 0.95 },
    ];

    const text = `${merchantName} ${items.join(' ')}`.toLowerCase();

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          const category = await this.findCategoryByName(rule.category);
          if (category) {
            return { categoryId: category.id, confidence: rule.confidence };
          }
        }
      }
    }

    return this.getDefaultCategory();
  }

  private async aiClassification(
    merchantName: string,
    items: string[],
    totalAmount: number,
  ): Promise<{ categoryId: string; confidence: number } | null> {
    try {
      if (!this.openai) {
        return null;
      }

      const categories = await this.prisma.category.findMany({
        where: { userId: null, isActive: true },
        select: { id: true, name: true },
      });

      const prompt = `다음 영수증 정보를 분석하여 가장 적합한 카테고리를 선택하세요.

상점명: ${merchantName}
항목: ${items.join(', ')}
금액: ${totalAmount}원

사용 가능한 카테고리:
${categories.map((c) => `- ${c.name}`).join('\n')}

응답 형식 (JSON):
{
  "category": "카테고리명",
  "confidence": 0.0-1.0
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const category = categories.find((c) => c.name === result.category);

      if (category) {
        this.logger.log(`AI classified as: ${category.name} (${result.confidence})`);
        return {
          categoryId: category.id,
          confidence: result.confidence || 0.7,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`AI classification failed: ${error.message}`);
      return null;
    }
  }

  private async findCategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name, userId: null, isActive: true },
    });
  }

  private getDefaultCategory(): { categoryId: string; confidence: number } {
    return { categoryId: 'default-0', confidence: 0.5 };
  }
}
