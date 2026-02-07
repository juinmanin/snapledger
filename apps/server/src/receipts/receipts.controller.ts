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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ScanReceiptDto, ListReceiptsQueryDto, ConfirmReceiptDto } from './dto/receipt.dto';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private receiptsService: ReceiptsService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Scan and process receipt image' })
  @ApiResponse({ status: 201, description: 'Receipt scanned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async scanReceipt(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.receiptsService.scanReceipt(userId, file);
  }

  @Get()
  @ApiOperation({ summary: 'List receipts' })
  @ApiResponse({ status: 200, description: 'Receipts retrieved successfully' })
  async listReceipts(
    @CurrentUser('id') userId: string,
    @Query() query: ListReceiptsQueryDto,
  ) {
    return this.receiptsService.listReceipts(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: 200, description: 'Receipt retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') receiptId: string,
  ) {
    return this.receiptsService.getReceipt(userId, receiptId);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirm and update receipt' })
  @ApiResponse({ status: 200, description: 'Receipt confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async confirmReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') receiptId: string,
    @Body() dto: ConfirmReceiptDto,
  ) {
    return this.receiptsService.confirmReceipt(userId, receiptId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt' })
  @ApiResponse({ status: 200, description: 'Receipt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async deleteReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') receiptId: string,
  ) {
    return this.receiptsService.deleteReceipt(userId, receiptId);
  }
}
