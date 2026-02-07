import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import Tesseract from 'tesseract.js';

interface OcrResult {
  text: string;
  confidence: number;
  provider: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private visionClient: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const keyFilename = this.configService.get('googleVision.keyFilename');
    
    if (keyFilename) {
      this.visionClient = new ImageAnnotatorClient({
        keyFilename,
      });
    } else {
      this.visionClient = new ImageAnnotatorClient();
    }
  }

  async extractText(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      const result = await this.extractTextWithVision(imageBuffer);
      if (result.text && result.confidence > 0.5) {
        return result;
      }
      
      this.logger.warn('Vision API confidence low, falling back to Tesseract');
      return await this.extractTextWithTesseract(imageBuffer);
    } catch (error) {
      this.logger.error('Vision API failed, using Tesseract fallback:', error);
      return await this.extractTextWithTesseract(imageBuffer);
    }
  }

  private async extractTextWithVision(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      const [result] = await this.visionClient.textDetection(imageBuffer);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        throw new Error('No text detected by Vision API');
      }

      const text = detections[0].description || '';
      const confidence = result.fullTextAnnotation?.pages?.[0]?.confidence || 0.8;

      return {
        text,
        confidence,
        provider: 'google-vision',
      };
    } catch (error) {
      this.logger.error('Google Vision API error:', error);
      throw error;
    }
  }

  private async extractTextWithTesseract(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      const { data } = await Tesseract.recognize(imageBuffer, 'eng+kor', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      return {
        text: data.text,
        confidence: data.confidence / 100,
        provider: 'tesseract',
      };
    } catch (error) {
      this.logger.error('Tesseract OCR error:', error);
      return {
        text: '',
        confidence: 0,
        provider: 'tesseract',
      };
    }
  }
}
