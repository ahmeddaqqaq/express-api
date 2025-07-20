import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { TransactionController } from './transaction.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [PrismaModule, S3Module, AuditLogModule, IntegrationModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
