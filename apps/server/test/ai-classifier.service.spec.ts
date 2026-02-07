import { Test, TestingModule } from '@nestjs/testing';
import { AiClassifierService } from '../src/receipts/services/ai-classifier.service';
import { UserLearningService } from '../src/receipts/services/user-learning.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

jest.mock('openai');

describe('AiClassifierService', () => {
  let service: AiClassifierService;
  let userLearningService: UserLearningService;
  let prismaService: PrismaService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockCategories = [
    { id: 'cat-food', name: '식비', mode: 'both', categoryType: 'expense' },
    { id: 'cat-transport', name: '교통비', mode: 'both', categoryType: 'expense' },
    { id: 'cat-cafe', name: '카페/간식', mode: 'both', categoryType: 'expense' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiClassifierService,
        {
          provide: UserLearningService,
          useValue: {
            findUserPattern: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                OPENAI_API_KEY: 'test-api-key',
                OPENAI_MODEL: 'gpt-4o-mini',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiClassifierService>(AiClassifierService);
    userLearningService = module.get<UserLearningService>(UserLearningService);
    prismaService = module.get<PrismaService>(PrismaService);

    mockOpenAI = new OpenAI({ apiKey: 'test' }) as jest.Mocked<OpenAI>;
    (service as any).openai = mockOpenAI;
  });

  describe('classifyReceipt', () => {
    it('should use user pattern when available with high confidence', async () => {
      const receiptData = {
        merchantName: '스타벅스',
        items: [{ name: '아메리카노', price: 4500 }],
      };

      (userLearningService.findUserPattern as jest.Mock).mockResolvedValue({
        categoryId: 'cat-cafe',
        confidence: 0.95,
      });

      const result = await service.classifyReceipt('user-123', receiptData);

      expect(result.categoryId).toBe('cat-cafe');
      expect(result.confidence).toBe(0.95);
      expect(userLearningService.findUserPattern).toHaveBeenCalledWith(
        'user-123',
        '스타벅스',
      );
    });

    it('should use rule-based classification for common merchants', async () => {
      const receiptData = {
        merchantName: '스타벅스 강남점',
        items: [{ name: '아메리카노', price: 4500 }],
      };

      (userLearningService.findUserPattern as jest.Mock).mockResolvedValue(null);
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.classifyReceipt('user-123', receiptData);

      expect(result.categoryId).toBe('cat-cafe');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should fall back to GPT classification when rules fail', async () => {
      const receiptData = {
        merchantName: '알 수 없는 가맹점',
        items: [{ name: '알 수 없는 품목', price: 10000 }],
      };

      (userLearningService.findUserPattern as jest.Mock).mockResolvedValue(null);
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    categoryId: 'cat-food',
                    confidence: 0.75,
                    reasoning: '일반 식품으로 추정됩니다',
                  }),
                },
              },
            ],
          }),
        },
      } as any;

      const result = await service.classifyReceipt('user-123', receiptData);

      expect(result.categoryId).toBe('cat-food');
      expect(result.confidence).toBe(0.75);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should validate GPT response and fallback on invalid JSON', async () => {
      const receiptData = {
        merchantName: '테스트',
        items: [],
      };

      (userLearningService.findUserPattern as jest.Mock).mockResolvedValue(null);
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'invalid json',
                },
              },
            ],
          }),
        },
      } as any;

      const result = await service.classifyReceipt('user-123', receiptData);

      expect(result.categoryId).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('classifyWithRules', () => {
    it('should correctly classify coffee shops', () => {
      const merchants = ['스타벅스', '투썸플레이스', '이디야커피', '할리스'];

      merchants.forEach((merchant) => {
        const result = service['classifyWithRules'](
          { merchantName: merchant, items: [] },
          mockCategories,
        );
        expect(result?.categoryId).toBe('cat-cafe');
        expect(result?.confidence).toBeGreaterThan(0.9);
      });
    });

    it('should classify based on item keywords', () => {
      const receiptData = {
        merchantName: '일반 식당',
        items: [
          { name: '버스 요금', price: 1500 },
          { name: '지하철', price: 1400 },
        ],
      };

      const result = service['classifyWithRules'](receiptData, mockCategories);

      expect(result?.categoryId).toBe('cat-transport');
      expect(result?.confidence).toBeGreaterThan(0.8);
    });

    it('should return null for unrecognized patterns', () => {
      const receiptData = {
        merchantName: '완전히 새로운 업체',
        items: [{ name: '신상품', price: 50000 }],
      };

      const result = service['classifyWithRules'](receiptData, mockCategories);

      expect(result).toBeNull();
    });
  });

  describe('classifyWithGPT', () => {
    it('should format prompt correctly with Korean instructions', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    categoryId: 'cat-food',
                    confidence: 0.85,
                  }),
                },
              },
            ],
          }),
        },
      } as any;

      const receiptData = {
        merchantName: '맛있는 식당',
        items: [{ name: '김치찌개', price: 8000 }],
      };

      await service['classifyWithGPT']('user-123', receiptData);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('영수증 내용을 분석하여'),
            }),
          ]),
        }),
      );
    });

    it('should handle GPT API errors gracefully', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error')),
        },
      } as any;

      const receiptData = {
        merchantName: '테스트',
        items: [],
      };

      const result = await service['classifyWithGPT']('user-123', receiptData);

      expect(result.categoryId).toBe('cat-food');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('validateGPTResponse', () => {
    it('should validate correct response structure', () => {
      const validResponse = {
        categoryId: 'cat-food',
        confidence: 0.85,
        reasoning: 'Test reasoning',
      };

      const result = service['validateGPTResponse'](validResponse, mockCategories);

      expect(result).toBe(true);
    });

    it('should reject response with invalid categoryId', () => {
      const invalidResponse = {
        categoryId: 'invalid-id',
        confidence: 0.85,
      };

      const result = service['validateGPTResponse'](invalidResponse, mockCategories);

      expect(result).toBe(false);
    });

    it('should reject response with invalid confidence', () => {
      const invalidResponse = {
        categoryId: 'cat-food',
        confidence: 1.5,
      };

      const result = service['validateGPTResponse'](invalidResponse, mockCategories);

      expect(result).toBe(false);
    });
  });
});
