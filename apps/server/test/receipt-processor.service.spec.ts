import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptProcessorService } from '../src/receipts/services/receipt-processor.service';
import { OcrService } from '../src/receipts/services/ocr.service';
import { AiClassifierService } from '../src/receipts/services/ai-classifier.service';
import { ImagePreprocessorService } from '../src/receipts/services/image-preprocessor.service';
import { UserLearningService } from '../src/receipts/services/user-learning.service';
import { ReceiptsRepository } from '../src/receipts/receipts.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ReceiptStatus } from '@prisma/client';
import * as sharp from 'sharp';

jest.mock('sharp');
jest.mock('minio');

describe('ReceiptProcessorService', () => {
  let service: ReceiptProcessorService;
  let ocrService: OcrService;
  let aiClassifierService: AiClassifierService;
  let imagePreprocessorService: ImagePreprocessorService;
  let userLearningService: UserLearningService;
  let receiptsRepository: ReceiptsRepository;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'receipt.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024000,
    buffer: Buffer.from('fake-image-data'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
  } as Express.Multer.File;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userType: 'personal',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptProcessorService,
        {
          provide: OcrService,
          useValue: {
            extractText: jest.fn(),
          },
        },
        {
          provide: AiClassifierService,
          useValue: {
            classifyReceipt: jest.fn(),
          },
        },
        {
          provide: ImagePreprocessorService,
          useValue: {
            preprocess: jest.fn(),
          },
        },
        {
          provide: UserLearningService,
          useValue: {
            findUserPattern: jest.fn(),
            saveCorrection: jest.fn(),
          },
        },
        {
          provide: ReceiptsRepository,
          useValue: {
            create: jest.fn(),
            createItem: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
            },
            category: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MINIO_ENDPOINT: 'localhost',
                MINIO_PORT: 9000,
                MINIO_ACCESS_KEY: 'minioadmin',
                MINIO_SECRET_KEY: 'minioadmin',
                MINIO_BUCKET_NAME: 'receipts',
                MINIO_USE_SSL: false,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ReceiptProcessorService>(ReceiptProcessorService);
    ocrService = module.get<OcrService>(OcrService);
    aiClassifierService = module.get<AiClassifierService>(AiClassifierService);
    imagePreprocessorService = module.get<ImagePreprocessorService>(ImagePreprocessorService);
    userLearningService = module.get<UserLearningService>(UserLearningService);
    receiptsRepository = module.get<ReceiptsRepository>(ReceiptsRepository);
  });

  describe('processReceipt', () => {
    it('should successfully process a receipt through the 7-stage pipeline', async () => {
      // Mock preprocessing
      const mockProcessedBuffer = Buffer.from('processed-image');
      (imagePreprocessorService.preprocess as jest.Mock).mockResolvedValue(mockProcessedBuffer);

      // Mock OCR
      const mockOcrText = `
        [가맹점명] 스타벅스 강남점
        [사업자번호] 123-45-67890
        [날짜] 2026-02-07
        [시간] 14:30
        [품목] 아메리카노 4,500원
        [품목] 카페라떼 5,000원
        [합계] 9,500원
        [부가세] 950원
        [카드결제] **** 1234
      `;
      (ocrService.extractText as jest.Mock).mockResolvedValue(mockOcrText);

      // Mock AI classification
      const mockCategory = { id: 'cat-123', name: '식비' };
      (aiClassifierService.classifyReceipt as jest.Mock).mockResolvedValue({
        categoryId: mockCategory.id,
        confidence: 0.95,
      });

      // Mock repository
      const mockReceipt = {
        id: 'receipt-123',
        userId: mockUser.id,
        status: ReceiptStatus.parsed,
        merchantName: '스타벅스 강남점',
        totalAmount: 9500,
      };
      (receiptsRepository.create as jest.Mock).mockResolvedValue(mockReceipt);

      const result = await service.processReceipt(mockFile, mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe('receipt-123');
      expect(imagePreprocessorService.preprocess).toHaveBeenCalledWith(mockFile.buffer);
      expect(ocrService.extractText).toHaveBeenCalled();
      expect(aiClassifierService.classifyReceipt).toHaveBeenCalled();
      expect(receiptsRepository.create).toHaveBeenCalled();
    });

    it('should handle OCR failure gracefully', async () => {
      (imagePreprocessorService.preprocess as jest.Mock).mockResolvedValue(
        Buffer.from('processed'),
      );
      (ocrService.extractText as jest.Mock).mockRejectedValue(new Error('OCR failed'));

      const mockReceipt = {
        id: 'receipt-failed',
        status: ReceiptStatus.failed,
      };
      (receiptsRepository.create as jest.Mock).mockResolvedValue(mockReceipt);

      const result = await service.processReceipt(mockFile, mockUser.id);

      expect(result.status).toBe(ReceiptStatus.failed);
    });
  });

  describe('parseReceiptStructure', () => {
    it('should parse Korean receipt format correctly', () => {
      const ocrText = `
        스타벅스 강남점
        사업자번호: 123-45-67890
        2026년 02월 07일 14:30
        아메리카노 1 4,500
        카페라떼 1 5,000
        합계: 9,500원
        부가세: 950원
        신용카드: **** 1234
      `;

      const result = service['parseReceiptStructure'](ocrText);

      expect(result.merchantName).toBe('스타벅스 강남점');
      expect(result.businessNumber).toMatch(/123-45-67890/);
      expect(result.totalAmount).toBeCloseTo(9500);
      expect(result.taxAmount).toBeCloseTo(950);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('아메리카노');
      expect(result.items[0].price).toBeCloseTo(4500);
    });

    it('should handle missing fields gracefully', () => {
      const ocrText = `
        가맹점 이름만 있음
        금액: 5,000원
      `;

      const result = service['parseReceiptStructure'](ocrText);

      expect(result.merchantName).toBe('가맹점 이름만 있음');
      expect(result.businessNumber).toBeUndefined();
      expect(result.totalAmount).toBeCloseTo(5000);
    });
  });

  describe('createDraftTransaction', () => {
    it('should create a draft transaction with isConfirmed=false', async () => {
      const mockReceipt = {
        id: 'receipt-123',
        userId: 'user-123',
        merchantName: '스타벅스',
        totalAmount: 9500,
        receiptDate: new Date('2026-02-07'),
      };

      const mockCategory = { id: 'cat-123' };
      const mockTransaction = {
        id: 'txn-123',
        isConfirmed: false,
        amount: 9500,
      };

      const prismaService = service['prisma'];
      (prismaService.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (prismaService.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service['createDraftTransaction'](mockReceipt as any, 'cat-123');

      expect(result.isConfirmed).toBe(false);
      expect(result.amount).toBe(9500);
      expect(prismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isConfirmed: false,
            amount: 9500,
          }),
        }),
      );
    });
  });
});
