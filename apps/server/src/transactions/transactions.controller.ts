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
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  ListTransactionsQueryDto,
  TransactionSummaryQueryDto,
} from './dto/transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.list(userId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get transaction summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query() query: TransactionSummaryQueryDto,
  ) {
    return this.transactionsService.getSummary(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getById(
    @CurrentUser('id') userId: string,
    @Param('id') transactionId: string,
  ) {
    return this.transactionsService.getById(userId, transactionId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') transactionId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, transactionId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') transactionId: string,
  ) {
    return this.transactionsService.delete(userId, transactionId);
  }
}
