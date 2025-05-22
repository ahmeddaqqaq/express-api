// src/image/image.module.ts
import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, S3Module, ConfigModule],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule {}
