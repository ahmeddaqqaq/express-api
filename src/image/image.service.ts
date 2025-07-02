// image.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    const key = `images/${Date.now()}-${file.originalname}`;
    await this.s3Service.uploadFile(file, key);
    
    // Store the API URL instead of signed URL
    const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:4000';
    const url = `${baseUrl}/express/images/serve/${key}`;

    return this.prisma.image.create({
      data: {
        key,
        url,
        isActive: true,
      },
    });
  }

  async getImage(id: string) {
    return this.prisma.image.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });
  }

  async getImages() {
    return this.prisma.image.findMany({
      include: {
        transactions: true,
      },
    });
  }

  async deactivateImage(id: string) {
    return this.prisma.image.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getImageStream(key: string) {
    const response = await this.s3Service.getFileStream(key);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    return {
      buffer,
      contentType: response.ContentType || 'image/jpeg',
    };
  }

  async deleteImage(id: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) return;

    await this.s3Service.deleteFile(image.key);
    return this.prisma.image.delete({ where: { id } });
  }
}
