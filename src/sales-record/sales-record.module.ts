import { Module } from '@nestjs/common';
import { SalesRecordService } from './sales-record.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SalesRecordService],
  exports: [SalesRecordService],
})
export class SalesRecordModule {}