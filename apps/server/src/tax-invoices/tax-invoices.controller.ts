import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TaxInvoicesService } from './tax-invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaxInvoiceDto, UpdateTaxInvoiceDto, ListTaxInvoicesQueryDto } from './dto/tax-invoice.dto';

@ApiTags('tax-invoices')
@ApiBearerAuth()
@Controller('businesses/:businessId/tax-invoices')
@UseGuards(JwtAuthGuard)
export class TaxInvoicesController {
  constructor(private taxInvoicesService: TaxInvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tax invoice' })
  @ApiResponse({ status: 201, description: 'Tax invoice created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaxInvoiceDto,
  ) {
    return this.taxInvoicesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tax invoices' })
  @ApiResponse({ status: 200, description: 'Tax invoices retrieved successfully' })
  async list(
    @CurrentUser('id') userId: string,
    @Param('businessId') businessId: string,
    @Query() query: ListTaxInvoicesQueryDto,
  ) {
    return this.taxInvoicesService.list(userId, businessId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax invoice by ID' })
  @ApiResponse({ status: 200, description: 'Tax invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tax invoice not found' })
  async getById(
    @CurrentUser('id') userId: string,
    @Param('id') invoiceId: string,
  ) {
    return this.taxInvoicesService.getById(userId, invoiceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tax invoice' })
  @ApiResponse({ status: 200, description: 'Tax invoice updated successfully' })
  @ApiResponse({ status: 404, description: 'Tax invoice not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') invoiceId: string,
    @Body() dto: UpdateTaxInvoiceDto,
  ) {
    return this.taxInvoicesService.update(userId, invoiceId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tax invoice' })
  @ApiResponse({ status: 200, description: 'Tax invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tax invoice not found' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') invoiceId: string,
  ) {
    return this.taxInvoicesService.delete(userId, invoiceId);
  }
}
