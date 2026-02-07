import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List budgets with usage' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved successfully' })
  async list(@CurrentUser('id') userId: string) {
    return this.budgetsService.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async getById(
    @CurrentUser('id') userId: string,
    @Param('id') budgetId: string,
  ) {
    return this.budgetsService.getById(userId, budgetId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') budgetId: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(userId, budgetId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') budgetId: string,
  ) {
    return this.budgetsService.delete(userId, budgetId);
  }
}
