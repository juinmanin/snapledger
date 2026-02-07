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
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCategoryDto, UpdateCategoryDto, ListCategoriesQueryDto } from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a custom category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async list(
    @CurrentUser('id') userId: string,
    @Query() query: ListCategoriesQueryDto,
  ) {
    return this.categoriesService.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getById(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
  ) {
    return this.categoriesService.getById(userId, categoryId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, categoryId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') categoryId: string,
  ) {
    return this.categoriesService.delete(userId, categoryId);
  }
}
