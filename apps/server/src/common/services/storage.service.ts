export abstract class StorageService {
  abstract upload(file: Buffer, path: string, contentType?: string): Promise<string>;
  abstract getSignedUrl(path: string, expiresIn: number): Promise<string>;
  abstract delete(path: string): Promise<void>;
}
