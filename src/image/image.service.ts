// image.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import { FilterImagesDto } from './dto/filter-images.dto';

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    uploadedAtStage?: TransactionStatus,
    uploadedById?: string,
  ) {
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
        uploadedAtStage,
        uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getImage(id: string) {
    return this.prisma.image.findUnique({
      where: { id },
      include: {
        transactions: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getImages(filter?: FilterImagesDto) {
    const where: any = { isActive: true };
    
    if (filter?.uploadedAtStage) {
      where.uploadedAtStage = filter.uploadedAtStage;
    }

    return this.prisma.image.findMany({
      where,
      include: {
        transactions: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
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
    
    // Convert stream to buffer using the helper method
    const buffer = await this.s3Service.streamToBuffer(response.Body);
    
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
