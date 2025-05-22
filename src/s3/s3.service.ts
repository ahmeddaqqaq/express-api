import { Injectable } from '@nestjs/common';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

interface UploadResult {
  Key: string;
  Bucket: string;
  Location: string;
  ETag?: string;
}

@Injectable()
export class S3Service {
  storage = new Storage({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'),
  });

  bucket = this.storage.bucket(process.env.S3_BUCKET);

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    return await this.s3_upload(file, process.env.S3_BUCKET, file.mimetype);
  }

  async s3_upload(
    file: Express.Multer.File,
    bucketName: string,
    mimetype: string,
  ): Promise<UploadResult> {
    const objectKey = randomUUID();
    const fileUpload = this.bucket.file(objectKey);

    const metadata = {
      contentType: mimetype,
      contentDisposition: 'inline',
    };

    const stream = fileUpload.createWriteStream({
      metadata: metadata,
      resumable: false,
    });

    return new Promise<UploadResult>((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectKey}`;

        resolve({
          Key: objectKey,
          Bucket: bucketName,
          Location: publicUrl,
          ETag: fileUpload.metadata?.etag,
        });
      });

      stream.end(file.buffer);
    });
  }

  async getSignedUrl(objectKey: string): Promise<string> {
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
      responseDisposition: 'inline',
      responseType: 'application/octet-stream',
    };

    const [url] = await this.bucket.file(objectKey).getSignedUrl(options);
    return url;
  }

  getPublicUrl(objectKey: string): string {
    return `https://storage.googleapis.com/${process.env.S3_BUCKET}/${objectKey}`;
  }
}
