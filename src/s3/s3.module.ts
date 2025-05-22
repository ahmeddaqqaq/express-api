// src/s3/s3.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_INSTANCE',
      useFactory: (configService: ConfigService) => {
        return new S3({
          accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
          region: configService.get('AWS_REGION'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['S3_INSTANCE'],
})
export class S3Module {}
