import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@Controller('api/v1/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiResponse({ status: 200, description: 'Returns list of transactions' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('categoryId') categoryId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.transactionsService.findAll(userId, {
      categoryId,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Returns transaction statistics' })
  async getStatistics(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transactionsService.getStatistics(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiResponse({ status: 200, description: 'Returns the transaction' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.remove(id, userId);
  }
}
