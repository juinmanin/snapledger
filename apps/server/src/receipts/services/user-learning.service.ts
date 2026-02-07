import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserLearningService {
  private readonly logger = new Logger(UserLearningService.name);

  constructor(private prisma: PrismaService) {}

  async findSimilarMerchant(userId: string, merchantName: string): Promise<string | null> {
    try {
      if (!merchantName) return null;

      const corrections = await this.prisma.categoryCorrection.findMany({
        where: { userId },
      });

      for (const correction of corrections) {
        if (this.calculateSimilarity(merchantName, correction.merchantName) > 0.8) {
          this.logger.log(`Found similar merchant pattern: ${correction.merchantName} -> ${correction.correctedCategoryId}`);
          return correction.correctedCategoryId;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Find similar merchant failed: ${error.message}`);
      return null;
    }
  }

  async saveCorrection(userId: string, merchantName: string, originalCategoryId: string, correctedCategoryId: string) {
    try {
      await this.prisma.categoryCorrection.upsert({
        where: {
          userId_merchantName: {
            userId,
            merchantName,
          },
        },
        create: {
          userId,
          merchantName,
          originalCategoryId,
          correctedCategoryId,
        },
        update: {
          correctedCategoryId,
        },
      });

      this.logger.log(`Saved learning correction for ${merchantName}`);
    } catch (error) {
      this.logger.error(`Save correction failed: ${error.message}`);
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
