// image.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    const key = `images/${Date.now()}-${file.originalname}`;
    await this.s3Service.uploadFile(file, key);
    const url = await this.s3Service.getFileUrl(key);

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

  async deleteImage(id: string) {
    const image = await this.prisma.image.findUnique({ where: { id } });
    if (!image) return;

    await this.s3Service.deleteFile(image.key);
    return this.prisma.image.delete({ where: { id } });
  }
}
