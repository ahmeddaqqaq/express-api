import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TechnicianModule } from '../technician/technician.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TechnicianModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}