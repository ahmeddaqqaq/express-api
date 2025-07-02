// s3.service.ts
import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = configService.get('WASABI_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: configService.get('WASABI_REGION'),
      endpoint: configService.get('WASABI_ENDPOINT'),
      credentials: {
        accessKeyId: configService.get('WASABI_ACCESS_KEY'),
        secretAccessKey: configService.get('WASABI_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    key: string,
    isPublic: boolean = true,
  ) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: isPublic ? 'public-read' : 'private',
      CacheControl: 'max-age=31536000',
    });

    await this.s3Client.send(command);
    return key;
  }

  async getFileUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `${this.configService.get('WASABI_ENDPOINT')}/${this.bucketName}/${key}`;
  }

  async getFileStream(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.error('Error fetching file from S3:', error);
      throw error;
    }
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async streamToBuffer(stream: any): Promise<Buffer> {
    if (!stream) {
      throw new Error('Stream is null or undefined');
    }

    // Handle different stream types from AWS SDK v3
    if (stream instanceof Readable) {
      // Node.js Readable stream
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }

    // Handle async iterable streams
    if (stream[Symbol.asyncIterator]) {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    // Handle ReadableStream (web streams)
    if (stream.getReader) {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return Buffer.from(result);
      } finally {
        reader.releaseLock();
      }
    }

    // Fallback for other types
    if (stream.arrayBuffer) {
      return Buffer.from(await stream.arrayBuffer());
    }

    throw new Error('Unsupported stream type');
  }
}
