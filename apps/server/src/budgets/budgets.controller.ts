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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@ApiTags('budgets')
@Controller('api/v1/budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiResponse({ status: 200, description: 'Returns list of budgets' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('active') active?: string,
  ) {
    return this.budgetsService.findAll(userId, active === 'true');
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get budget progress' })
  @ApiResponse({ status: 200, description: 'Returns budget progress data' })
  async getProgress(@CurrentUser('id') userId: string) {
    return this.budgetsService.getBudgetProgress(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  @ApiResponse({ status: 200, description: 'Returns the budget' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.budgetsService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateBudgetDto>,
  ) {
    return this.budgetsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.budgetsService.remove(id, userId);
  }
}
