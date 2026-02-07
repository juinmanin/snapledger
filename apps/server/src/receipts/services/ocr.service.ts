import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as vision from '@google-cloud/vision';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private visionClient: vision.ImageAnnotatorClient | null = null;

  constructor(private configService: ConfigService) {
    try {
      const credentials = this.configService.get<string>('GOOGLE_CLOUD_CREDENTIALS');
      if (credentials) {
        this.visionClient = new vision.ImageAnnotatorClient({
          credentials: JSON.parse(credentials),
        });
        this.logger.log('Google Cloud Vision initialized');
      } else {
        this.logger.warn('Google Cloud Vision credentials not found, will use Tesseract fallback');
      }
    } catch (error) {
      this.logger.warn(`Google Cloud Vision initialization failed: ${error.message}`);
    }
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    try {
      // Try Google Vision first
      if (this.visionClient) {
        try {
          const [result] = await this.visionClient.textDetection(imageBuffer);
          const detections = result.textAnnotations;
          
          if (detections && detections.length > 0) {
            const text = detections[0].description || '';
            this.logger.log('OCR completed using Google Vision');
            return text;
          }
        } catch (error) {
          this.logger.warn(`Google Vision failed: ${error.message}, falling back to Tesseract`);
        }
      }

      // Fallback to Tesseract
      return await this.extractTextWithTesseract(imageBuffer);
    } catch (error) {
      this.logger.error(`OCR extraction failed: ${error.message}`);
      return '';
    }
  }

  private async extractTextWithTesseract(imageBuffer: Buffer): Promise<string> {
    let worker;
    try {
      worker = await createWorker('kor+eng');
      const { data } = await worker.recognize(imageBuffer);
      this.logger.log('OCR completed using Tesseract');
      return data.text;
    } catch (error) {
      this.logger.error(`Tesseract OCR failed: ${error.message}`);
      return '';
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }
}
