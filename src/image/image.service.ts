// src/image/image.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Image, Transaction } from '@prisma/client';
// import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { extname, join } from 'path';
// import { Inject } from '@nestjs/common';
import { ensureDir, writeFile, unlink } from 'fs-extra';
import { promisify } from 'util';
import { existsSync } from 'fs';

@Injectable()
export class ImageService {
  private readonly uploadDir = './uploads';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, // @Inject('S3_INSTANCE') private s3: S3,
  ) {
    ensureDir(this.uploadDir); // Create upload directory if it doesn't exist
  }

  async fetchAll() {
    const resp = await this.prisma.image.findMany({
      select: { id: true, url: true },
    });
    return resp;
  }

  async uploadToLocal(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const key = `${Date.now().toString()}${extname(file.originalname)}`;
    const filePath = join(this.uploadDir, key);
    await writeFile(filePath, file.buffer);

    const url = `${
      this.configService.get('APP_URL') || 'http://localhost:3000'
    }/uploads/${key}`;
    return { url, key };
  }

  async createImage(file: Express.Multer.File): Promise<Image> {
    // Local version
    const { url, key } = await this.uploadToLocal(file);

    // AWS S3 version (commented out)
    // const { url, key } = await this.uploadToS3(file);

    return this.prisma.image.create({
      data: {
        key,
        url,
        isActive: true,
      },
    });
  }

  async getImage(id: string): Promise<Image | null> {
    return this.prisma.image.findUnique({
      where: { id },
    });
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) return;

    // Local version
    const filePath = join(this.uploadDir, image.key);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // AWS S3 version (commented out)
    // await this.s3
    //   .deleteObject({
    //     Bucket: this.configService.get('AWS_BUCKET_NAME'),
    //     Key: image.key,
    //   })
    //   .promise();

    await this.prisma.image.delete({ where: { id } });
  }

  async assignImageToBrand(imageId: string, brandId: string): Promise<Image> {
    return this.prisma.image.update({
      where: { id: imageId },
      data: {
        brand: {
          connect: { id: brandId },
        },
      },
    });
  }

  async assignImagesToTransaction(
    imageIds: string[],
    transactionId: string,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        images: {
          connect: imageIds.map((id) => ({ id })),
        },
      },
      include: { images: true },
    });
  }
}
