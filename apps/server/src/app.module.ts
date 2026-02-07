import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './common/config/configuration';
import { AuthModule } from './auth/auth.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TaxModule } from './tax/tax.module';
import { AnalysisModule } from './analysis/analysis.module';
import { BatchModule } from './batch/batch.module';
import { PrismaService } from './prisma/prisma.service';
import { StorageService } from './common/services/storage.service';
import { MinioStorageService } from './common/services/minio-storage.service';
import { GcsStorageService } from './common/services/gcs-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    ReceiptsModule,
    TransactionsModule,
    BudgetsModule,
    CategoriesModule,
    ReportsModule,
    OrganizationsModule,
    TaxModule,
    AnalysisModule,
    BatchModule,
  ],
  providers: [
    PrismaService,
    {
      provide: StorageService,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('storageProvider');
        
        if (provider === 'gcs') {
          return new GcsStorageService(configService);
        }
        
        return new MinioStorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
