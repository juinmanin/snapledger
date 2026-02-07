import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReceiptProcessorService } from './services/receipt-processor.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';

@ApiTags('receipts')
@Controller('api/v1/receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(
    private receiptProcessor: ReceiptProcessorService,
    private prisma: PrismaService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and process a receipt image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Receipt uploaded and processed successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body() dto: UploadReceiptDto,
  ) {
    const result = await this.receiptProcessor.processReceipt(file, userId);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all receipts for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of receipts' })
  async getReceipts(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const receipts = await this.prisma.receipt.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      include: {
        items: true,
        transaction: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });

    return receipts;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific receipt by ID' })
  @ApiResponse({ status: 200, description: 'Returns the receipt' })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  async getReceipt(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const receipt = await this.prisma.receipt.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
        transaction: {
          include: {
            category: true,
          },
        },
      },
    });

    return receipt;
  }
}
