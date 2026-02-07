import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';

interface BackupData {
  transactions: any[];
  receipts: any[];
  budgets: any[];
  categories: any[];
  exportDate: string;
  version: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly BACKUP_FOLDER_NAME = 'SnapLedger Backups';

  constructor(private prisma: PrismaService) {}

  async backupData(userId: string): Promise<{ fileId: string; fileName: string }> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthAccount || !oauthAccount.accessToken) {
        throw new Error('Google account not connected');
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: oauthAccount.accessToken,
        refresh_token: oauthAccount.refreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const folderId = await this.getOrCreateBackupFolder(drive);

      const backupData = await this.collectUserData(userId);

      const fileName = `snapledger-backup-${new Date().toISOString()}.json`;
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(backupData, null, 2),
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name',
      });

      if (!file.data.id || !file.data.name) {
        throw new Error('Failed to create backup file');
      }

      this.logger.log(`Backup created: ${file.data.id}`);

      return {
        fileId: file.data.id,
        fileName: file.data.name,
      };
    } catch (error) {
      this.logger.error('Google Drive backup failed:', error);
      throw error;
    }
  }

  async restoreData(userId: string, fileId: string): Promise<void> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthAccount || !oauthAccount.accessToken) {
        throw new Error('Google account not connected');
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: oauthAccount.accessToken,
        refresh_token: oauthAccount.refreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      const backupData: BackupData = response.data as any;

      await this.prisma.$transaction(async (tx) => {
        if (backupData.categories && backupData.categories.length > 0) {
          for (const category of backupData.categories) {
            await tx.category.upsert({
              where: {
                id: category.id,
              },
              create: {
                ...category,
                userId,
              },
              update: category,
            });
          }
        }

        if (backupData.transactions && backupData.transactions.length > 0) {
          for (const transaction of backupData.transactions) {
            await tx.transaction.upsert({
              where: {
                id: transaction.id,
              },
              create: {
                ...transaction,
                userId,
                date: new Date(transaction.date),
              },
              update: {
                ...transaction,
                date: new Date(transaction.date),
              },
            });
          }
        }

        if (backupData.budgets && backupData.budgets.length > 0) {
          for (const budget of backupData.budgets) {
            await tx.budget.upsert({
              where: {
                id: budget.id,
              },
              create: {
                ...budget,
                userId,
                startDate: new Date(budget.startDate),
                endDate: new Date(budget.endDate),
              },
              update: {
                ...budget,
                startDate: new Date(budget.startDate),
                endDate: new Date(budget.endDate),
              },
            });
          }
        }
      });

      this.logger.log(`Data restored from backup: ${fileId}`);
    } catch (error) {
      this.logger.error('Google Drive restore failed:', error);
      throw error;
    }
  }

  async listBackups(
    userId: string,
  ): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
    try {
      const oauthAccount = await this.prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider: 'google',
        },
      });

      if (!oauthAccount || !oauthAccount.accessToken) {
        throw new Error('Google account not connected');
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: oauthAccount.accessToken,
        refresh_token: oauthAccount.refreshToken,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const folderId = await this.getOrCreateBackupFolder(drive);

      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'snapledger-backup' and trashed=false`,
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc',
      });

      if (!response.data.files) {
        return [];
      }

      return response.data.files
        .filter((file) => file.id && file.name && file.createdTime)
        .map((file) => ({
          id: file.id!,
          name: file.name!,
          createdAt: new Date(file.createdTime!),
        }));
    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  private async getOrCreateBackupFolder(drive: any): Promise<string> {
    const response = await drive.files.list({
      q: `name='${this.BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    const folderMetadata = {
      name: this.BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    return folder.data.id;
  }

  private async collectUserData(userId: string): Promise<BackupData> {
    const [transactions, receipts, budgets, categories] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          category: true,
        },
      }),
      this.prisma.receipt.findMany({
        where: { userId },
        select: {
          id: true,
          merchantName: true,
          totalAmount: true,
          date: true,
          suggestedCategory: true,
          ocrText: true,
          status: true,
        },
      }),
      this.prisma.budget.findMany({
        where: { userId },
      }),
      this.prisma.category.findMany({
        where: { userId },
      }),
    ]);

    return {
      transactions,
      receipts,
      budgets,
      categories,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };
  }
}
