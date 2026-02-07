import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { TaxEngineService, TaxClassificationResult } from './services/tax-engine.service';
import { ClassifyTransactionDto } from './dto/classify-transaction.dto';

@ApiTags('tax')
@Controller('api/v1/tax')
@UseGuards(JwtAuthGuard)
export class TaxController {
  constructor(
    private prisma: PrismaService,
    private taxEngine: TaxEngineService,
  ) {}

  @Get('countries')
  @ApiOperation({ summary: 'List supported countries' })
  @ApiResponse({ status: 200, description: 'Returns list of supported countries' })
  async getCountries() {
    const countries = await this.prisma.country.findMany({
      orderBy: { name: 'asc' },
    });
    return countries;
  }

  @Get('countries/:countryId/rules')
  @ApiOperation({ summary: 'Get tax rules for a country' })
  @ApiResponse({ status: 200, description: 'Returns tax rules' })
  async getTaxRules(@Param('countryId') countryId: string) {
    const rules = await this.taxEngine.loadTaxRulesForCountry(countryId);
    return rules;
  }

  @Get('countries/:countryId/seasons')
  @ApiOperation({ summary: 'Get tax seasons for a country' })
  @ApiResponse({ status: 200, description: 'Returns tax seasons' })
  async getTaxSeasons(@Param('countryId') countryId: string) {
    const seasons = await this.taxEngine.getTaxSeasons(countryId);
    return seasons;
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify transaction for tax deduction' })
  @ApiResponse({ status: 200, description: 'Returns tax classification' })
  async classifyTransaction(
    @CurrentUser('id') userId: string,
    @Body() dto: ClassifyTransactionDto,
  ): Promise<TaxClassificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    const countryId = user?.country || 'KR';

    let categoryName: string | undefined;
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { name: true },
      });
      categoryName = category?.name;
    }

    const result = await this.taxEngine.classifyTransaction(
      countryId,
      dto.amount,
      dto.description,
      dto.merchantName,
      categoryName,
      dto.paymentMethod,
    );

    return result;
  }
}
