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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('categories')
@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, dto);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize default categories for user' })
  @ApiResponse({ status: 201, description: 'Default categories initialized' })
  async initializeDefaults(@CurrentUser('id') userId: string) {
    await this.categoriesService.initializeDefaultCategories(userId);
    return { message: 'Default categories initialized successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns list of categories' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
  ) {
    return this.categoriesService.findAll(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Returns the category' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.categoriesService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.categoriesService.remove(id, userId);
  }
}
