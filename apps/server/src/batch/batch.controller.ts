import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BatchUploadService } from './services/batch-upload.service';
import { UploadBatchDto } from './dto/upload-batch.dto';
import { UpdateBatchItemDto } from './dto/update-batch-item.dto';
import { ApproveBatchItemDto } from './dto/approve-batch-item.dto';

@ApiTags('batch')
@Controller('api/v1/batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
  constructor(private batchUpload: BatchUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Create batch and upload files' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Batch created and processing started' })
  @UseInterceptors(FilesInterceptor('files', 50))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @Body() dto: UploadBatchDto,
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    const batch = await this.batchUpload.createBatch(userId, files, dto.name);
    return batch;
  }

  @Get()
  @ApiOperation({ summary: "List user's batches" })
  @ApiResponse({ status: 200, description: 'Returns list of batches' })
  async listBatches(@CurrentUser('id') userId: string) {
    return await this.batchUpload.listBatches(userId);
  }

  @Get(':batchId')
  @ApiOperation({ summary: 'Get batch details with items' })
  @ApiResponse({ status: 200, description: 'Returns batch with items' })
  async getBatch(
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.batchUpload.getBatch(batchId, userId);
  }

  @Get(':batchId/items')
  @ApiOperation({ summary: 'List items in batch' })
  @ApiResponse({ status: 200, description: 'Returns batch items' })
  async getBatchItems(
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.batchUpload.getBatchItems(batchId, userId);
  }

  @Put(':batchId/items/:itemId')
  @ApiOperation({ summary: 'Update batch item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async updateItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBatchItemDto,
  ) {
    return await this.batchUpload.updateItem(itemId, userId, dto);
  }

  @Post(':batchId/items/:itemId/approve')
  @ApiOperation({ summary: 'Approve batch item' })
  @ApiResponse({ status: 200, description: 'Item approved' })
  async approveItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveBatchItemDto,
  ) {
    return await this.batchUpload.approveItem(itemId, userId);
  }

  @Post(':batchId/approve-all')
  @ApiOperation({ summary: 'Approve all high-confidence items' })
  @ApiResponse({ status: 200, description: 'High-confidence items approved' })
  async approveAllHighConfidence(
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.batchUpload.approveAllHighConfidence(batchId, userId);
  }

  @Delete(':batchId')
  @ApiOperation({ summary: 'Cancel/delete batch' })
  @ApiResponse({ status: 200, description: 'Batch cancelled' })
  async deleteBatch(
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.batchUpload.deleteBatch(batchId, userId);
  }

  @Post(':batchId/retry-failed')
  @ApiOperation({ summary: 'Retry failed items' })
  @ApiResponse({ status: 200, description: 'Retrying failed items' })
  async retryFailed(
    @Param('batchId') batchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return await this.batchUpload.retryFailed(batchId, userId);
  }
}
