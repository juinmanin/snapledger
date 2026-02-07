import { PrismaClient, CategoryType, ModeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultCategories = [
    // Personal & Business expenses
    { name: '식비', type: CategoryType.expense, mode: ModeType.personal },
    { name: '교통비', type: CategoryType.expense, mode: ModeType.personal },
    { name: '주거비', type: CategoryType.expense, mode: ModeType.personal },
    { name: '통신비', type: CategoryType.expense, mode: ModeType.personal },
    { name: '의류/미용', type: CategoryType.expense, mode: ModeType.personal },
    { name: '의료/건강', type: CategoryType.expense, mode: ModeType.personal },
    { name: '교육', type: CategoryType.expense, mode: ModeType.personal },
    { name: '문화/여가', type: CategoryType.expense, mode: ModeType.personal },
    { name: '생활용품', type: CategoryType.expense, mode: ModeType.personal },
    { name: '경조사', type: CategoryType.expense, mode: ModeType.personal },
    
    // Business expenses
    { name: '원재료비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '인건비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '임차료', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '접대비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '소모품비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '광고선전비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '운반비', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    { name: '수수료', type: CategoryType.expense, mode: ModeType.business, taxDeductible: true },
    
    // Income categories
    { name: '급여', type: CategoryType.income, mode: ModeType.personal },
    { name: '용돈', type: CategoryType.income, mode: ModeType.personal },
    { name: '매출', type: CategoryType.income, mode: ModeType.business },
    { name: '이자수입', type: CategoryType.income, mode: ModeType.both },
    { name: '기타수입', type: CategoryType.income, mode: ModeType.both },
  ];

  for (const [index, category] of defaultCategories.entries()) {
    await prisma.category.upsert({
      where: { id: `default-${index}` },
      update: {},
      create: {
        id: `default-${index}`,
        name: category.name,
        categoryType: category.type,
        mode: category.mode,
        taxDeductible: category.taxDeductible || false,
        sortOrder: index,
        isActive: true,
      },
    });
  }

  console.log(`✅ Created ${defaultCategories.length} default categories`);
  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
