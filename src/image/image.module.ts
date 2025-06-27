// image.module.ts
import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { S3Module } from '../s3/s3.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [S3Module, PrismaModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService], // Export if other modules need to use ImageService
})
export class ImageModule {}
