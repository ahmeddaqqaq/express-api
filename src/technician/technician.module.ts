import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [TechnicianController],
  providers: [TechnicianService],
})
export class TechnicianModule {}
