import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ClassificationResult {
  merchantName: string;
  amount: number;
  date: string;
  suggestedCategory: string;
  confidence: number;
}

interface ParsedReceiptData {
  merchantName: string;
  merchantAddress?: string;
  merchantPhone?: string;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  date: string;
  time?: string;
  paymentMethod?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  suggestedCategory: string;
  confidence: number;
}

@Injectable()
export class AiClassifierService {
  private readonly logger = new Logger(AiClassifierService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('googleAi.apiKey');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    });
  }

  async classify(ocrText: string): Promise<ClassificationResult> {
    try {
      const prompt = `You are a financial transaction classifier. Analyze the receipt text and extract key information.

Receipt Text:
${ocrText}

Return JSON with the following structure:
{
  "merchantName": "string",
  "amount": number,
  "date": "YYYY-MM-DD",
  "suggestedCategory": "string (one of: Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Bills & Utilities, Groceries, Travel, Education, Other)",
  "confidence": number (0-1)
}

Extract the merchant name, total amount, transaction date, and suggest an appropriate category based on the merchant type and items purchased.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text);
      
      return {
        merchantName: parsed.merchantName || 'Unknown',
        amount: parseFloat(parsed.amount) || 0,
        date: parsed.date || new Date().toISOString().split('T')[0],
        suggestedCategory: parsed.suggestedCategory || 'Other',
        confidence: parseFloat(parsed.confidence) || 0.5,
      };
    } catch (error) {
      this.logger.error('AI classification failed:', error);
      return {
        merchantName: 'Unknown',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        suggestedCategory: 'Other',
        confidence: 0,
      };
    }
  }

  async parseReceiptText(ocrText: string): Promise<ParsedReceiptData> {
    try {
      const prompt = `You are an expert receipt parser. Extract all relevant information from this receipt text.

Receipt Text:
${ocrText}

Return JSON with the following structure:
{
  "merchantName": "string",
  "merchantAddress": "string",
  "merchantPhone": "string",
  "totalAmount": number,
  "subtotal": number,
  "tax": number,
  "tip": number,
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "paymentMethod": "string",
  "items": [
    {
      "name": "string",
      "quantity": number,
      "price": number
    }
  ],
  "suggestedCategory": "string (one of: Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Bills & Utilities, Groceries, Travel, Education, Other)",
  "confidence": number (0-1)
}

Extract all available information. If some fields are not present in the receipt, omit them from the response.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text);
      
      return {
        merchantName: parsed.merchantName || 'Unknown',
        merchantAddress: parsed.merchantAddress,
        merchantPhone: parsed.merchantPhone,
        totalAmount: parseFloat(parsed.totalAmount) || 0,
        subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : undefined,
        tax: parsed.tax ? parseFloat(parsed.tax) : undefined,
        tip: parsed.tip ? parseFloat(parsed.tip) : undefined,
        date: parsed.date || new Date().toISOString().split('T')[0],
        time: parsed.time,
        paymentMethod: parsed.paymentMethod,
        items: parsed.items || [],
        suggestedCategory: parsed.suggestedCategory || 'Other',
        confidence: parseFloat(parsed.confidence) || 0.5,
      };
    } catch (error) {
      this.logger.error('Receipt parsing failed:', error);
      return {
        merchantName: 'Unknown',
        totalAmount: 0,
        date: new Date().toISOString().split('T')[0],
        suggestedCategory: 'Other',
        confidence: 0,
      };
    }
  }
}
