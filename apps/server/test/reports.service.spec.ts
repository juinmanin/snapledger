import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../src/reports/reports.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransactionType, CategoryType } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockTransactions = [
    {
      id: 'txn-1',
      userId: mockUser.id,
      transactionType: TransactionType.expense,
      amount: 50000,
      transactionDate: new Date('2026-02-01'),
      category: { id: 'cat-1', name: '식비', categoryType: CategoryType.expense },
    },
    {
      id: 'txn-2',
      userId: mockUser.id,
      transactionType: TransactionType.expense,
      amount: 30000,
      transactionDate: new Date('2026-02-05'),
      category: { id: 'cat-2', name: '교통비', categoryType: CategoryType.expense },
    },
    {
      id: 'txn-3',
      userId: mockUser.id,
      transactionType: TransactionType.income,
      amount: 3000000,
      transactionDate: new Date('2026-02-01'),
      category: { id: 'cat-3', name: '급여', categoryType: CategoryType.income },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
            },
            taxInvoice: {
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            category: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getIncomeExpenseReport', () => {
    it('should calculate income and expense totals correctly', async () => {
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await service.getIncomeExpenseReport(
        mockUser.id,
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.summary.totalIncome).toBe(3000000);
      expect(result.summary.totalExpense).toBe(80000);
      expect(result.summary.netAmount).toBe(2920000);
    });

    it('should group expenses by category with percentages', async () => {
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await service.getIncomeExpenseReport(
        mockUser.id,
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      const foodCategory = result.byCategory.find((c) => c.categoryName === '식비');
      const transportCategory = result.byCategory.find((c) => c.categoryName === '교통비');

      expect(foodCategory).toBeDefined();
      expect(foodCategory.amount).toBe(50000);
      expect(foodCategory.percentage).toBeCloseTo(62.5);

      expect(transportCategory).toBeDefined();
      expect(transportCategory.amount).toBe(30000);
      expect(transportCategory.percentage).toBeCloseTo(37.5);
    });

    it('should create daily trend data', async () => {
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await service.getIncomeExpenseReport(
        mockUser.id,
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.dailyTrend).toHaveLength(28);

      const day1 = result.dailyTrend.find((d) => d.date === '2026-02-01');
      expect(day1.income).toBe(3000000);
      expect(day1.expense).toBe(50000);
      expect(day1.net).toBe(2950000);

      const day5 = result.dailyTrend.find((d) => d.date === '2026-02-05');
      expect(day5.income).toBe(0);
      expect(day5.expense).toBe(30000);
      expect(day5.net).toBe(-30000);
    });

    it('should handle empty transactions', async () => {
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getIncomeExpenseReport(
        mockUser.id,
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.summary.totalIncome).toBe(0);
      expect(result.summary.totalExpense).toBe(0);
      expect(result.summary.netAmount).toBe(0);
      expect(result.byCategory).toHaveLength(0);
      expect(result.dailyTrend).toHaveLength(28);
    });

    it('should filter by businessId when provided', async () => {
      await service.getIncomeExpenseReport(
        mockUser.id,
        new Date('2026-02-01'),
        new Date('2026-02-28'),
        'business-123',
      );

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: 'business-123',
          }),
        }),
      );
    });
  });

  describe('getTaxSummary', () => {
    const mockTaxInvoices = [
      {
        invoiceType: 'sales',
        supplyAmount: 10000000,
        taxAmount: 1000000,
        totalAmount: 11000000,
      },
      {
        invoiceType: 'sales',
        supplyAmount: 5000000,
        taxAmount: 500000,
        totalAmount: 5500000,
      },
      {
        invoiceType: 'purchase',
        supplyAmount: 3000000,
        taxAmount: 300000,
        totalAmount: 3300000,
      },
    ];

    const mockDeductibleExpenses = [
      {
        transactionType: TransactionType.expense,
        amount: 2000000,
        category: { taxDeductible: true },
      },
      {
        transactionType: TransactionType.expense,
        amount: 1000000,
        category: { taxDeductible: false },
      },
    ];

    it('should calculate sales and purchase tax correctly', async () => {
      (prismaService.taxInvoice.findMany as jest.Mock).mockResolvedValue(mockTaxInvoices);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(
        mockDeductibleExpenses,
      );

      const result = await service.getTaxSummary(
        'business-123',
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.salesInvoices.count).toBe(2);
      expect(result.salesInvoices.totalSupply).toBe(15000000);
      expect(result.salesInvoices.totalTax).toBe(1500000);
      expect(result.salesInvoices.totalAmount).toBe(16500000);

      expect(result.purchaseInvoices.count).toBe(1);
      expect(result.purchaseInvoices.totalSupply).toBe(3000000);
      expect(result.purchaseInvoices.totalTax).toBe(300000);
    });

    it('should calculate VAT payable correctly', async () => {
      (prismaService.taxInvoice.findMany as jest.Mock).mockResolvedValue(mockTaxInvoices);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(
        mockDeductibleExpenses,
      );

      const result = await service.getTaxSummary(
        'business-123',
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      const expectedVAT = 1500000 - 300000;
      expect(result.vatPayable).toBe(expectedVAT);
    });

    it('should calculate tax deductible expenses correctly', async () => {
      (prismaService.taxInvoice.findMany as jest.Mock).mockResolvedValue(mockTaxInvoices);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue(
        mockDeductibleExpenses,
      );

      const result = await service.getTaxSummary(
        'business-123',
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.deductibleExpenses.totalAmount).toBe(2000000);
      expect(result.deductibleExpenses.count).toBe(1);
    });

    it('should handle no tax invoices', async () => {
      (prismaService.taxInvoice.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.transaction.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTaxSummary(
        'business-123',
        new Date('2026-02-01'),
        new Date('2026-02-28'),
      );

      expect(result.salesInvoices.count).toBe(0);
      expect(result.purchaseInvoices.count).toBe(0);
      expect(result.vatPayable).toBe(0);
      expect(result.deductibleExpenses.totalAmount).toBe(0);
    });
  });

  describe('calculatePercentages', () => {
    it('should calculate percentages correctly', () => {
      const data = [
        { amount: 60, categoryName: 'A' },
        { amount: 30, categoryName: 'B' },
        { amount: 10, categoryName: 'C' },
      ];

      const result = service['calculatePercentages'](data);

      expect(result[0].percentage).toBeCloseTo(60);
      expect(result[1].percentage).toBeCloseTo(30);
      expect(result[2].percentage).toBeCloseTo(10);
    });

    it('should handle zero total', () => {
      const data = [
        { amount: 0, categoryName: 'A' },
        { amount: 0, categoryName: 'B' },
      ];

      const result = service['calculatePercentages'](data);

      expect(result[0].percentage).toBe(0);
      expect(result[1].percentage).toBe(0);
    });
  });

  describe('generateDailyTrend', () => {
    it('should create daily entries for the entire date range', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-03');

      const result = service['generateDailyTrend'](mockTransactions as any, startDate, endDate);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2026-02-01');
      expect(result[1].date).toBe('2026-02-02');
      expect(result[2].date).toBe('2026-02-03');
    });

    it('should aggregate transactions by date', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-05');

      const result = service['generateDailyTrend'](mockTransactions as any, startDate, endDate);

      const day1 = result.find((d) => d.date === '2026-02-01');
      expect(day1.income).toBe(3000000);
      expect(day1.expense).toBe(50000);
    });

    it('should fill zero for days without transactions', () => {
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-05');

      const result = service['generateDailyTrend'](mockTransactions as any, startDate, endDate);

      const day2 = result.find((d) => d.date === '2026-02-02');
      expect(day2.income).toBe(0);
      expect(day2.expense).toBe(0);
      expect(day2.net).toBe(0);
    });
  });
});
