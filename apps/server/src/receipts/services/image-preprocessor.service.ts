import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImagePreprocessorService {
  private readonly logger = new Logger(ImagePreprocessorService.name);

  async preprocess(buffer: Buffer): Promise<Buffer> {
    try {
      this.logger.log('Starting image preprocessing...');

      const processedImage = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .resize(2480, 3508, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .grayscale()
        .normalize()
        .sharpen()
        .png({ compressionLevel: 9 })
        .toBuffer();

      this.logger.log('Image preprocessing completed');

      return processedImage;
    } catch (error) {
      this.logger.error(`Image preprocessing failed: ${error.message}`);
      throw error;
    }
  }

  async createThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize(300, 400, { fit: 'cover' })
        .webp({ quality: 70 })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Thumbnail creation failed: ${error.message}`);
      throw error;
    }
  }

  async convertToWebP(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .webp({ quality: 90 })
        .toBuffer();
    } catch (error) {
      this.logger.error(`WebP conversion failed: ${error.message}`);
      throw error;
    }
  }
}
