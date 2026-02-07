import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { StorageService } from './storage.service';

@Injectable()
export class MinioStorageService extends StorageService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    super();
    this.bucket = this.configService.get<string>('minio.bucket') || 'snapledger';
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint') || 'localhost',
      port: this.configService.get<number>('minio.port') || 9000,
      useSSL: this.configService.get<boolean>('minio.useSSL') || false,
      accessKey: this.configService.get<string>('minio.accessKey') || 'minioadmin',
      secretKey: this.configService.get<string>('minio.secretKey') || 'minioadmin',
    });
  }

  async onModuleInit() {
    const bucketExists = await this.client.bucketExists(this.bucket);
    if (!bucketExists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    const metadata = contentType ? { 'Content-Type': contentType } : {};
    await this.client.putObject(this.bucket, path, file, file.length, metadata);
    return path;
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    return await this.client.presignedGetObject(this.bucket, path, expiresIn);
  }

  async delete(path: string): Promise<void> {
    await this.client.removeObject(this.bucket, path);
  }
}
