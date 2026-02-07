import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TaxEngineService } from './services/tax-engine.service';
import { TaxSeederService } from './services/tax-seeder.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TaxController],
  providers: [TaxEngineService, TaxSeederService, PrismaService],
  exports: [TaxEngineService],
})
export class TaxModule {}
