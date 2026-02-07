import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { StorageService } from './storage.service';

@Injectable()
export class GcsStorageService extends StorageService {
  private storage: Storage;
  private bucket: string;

  constructor(private configService: ConfigService) {
    super();
    this.bucket = this.configService.get<string>('gcs.bucket') || 'snapledger';
    const keyFilename = this.configService.get('gcs.keyFilename');
    
    this.storage = new Storage({
      projectId: this.configService.get('gcs.projectId'),
      ...(keyFilename && { keyFilename }),
    });
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const fileHandle = bucket.file(path);
    
    await fileHandle.save(file, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    return path;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const file = bucket.file(path);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    
    return url;
  }

  async delete(path: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucket);
    await bucket.file(path).delete();
  }
}
