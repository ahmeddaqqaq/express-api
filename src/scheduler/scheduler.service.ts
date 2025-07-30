import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TechnicianService } from '../technician/technician.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly technicianService: TechnicianService) {}

  @Cron('0 1 * * *', {
    name: 'auto-end-shifts',
    timeZone: 'Asia/Amman',
  })
  async handleAutoEndShifts() {
    this.logger.log('Starting automated shift ending job at 1:00 AM Amman time (UTC+3)');
    
    try {
      const result = await this.technicianService.autoEndOpenShifts();
      
      this.logger.log(
        `Automated shift ending completed successfully: ` +
        `${result.endedShifts} shifts, ${result.endedBreaks} breaks, ` +
        `${result.endedOvertimes} overtimes ended. Total actions: ${result.totalActions}`
      );
    } catch (error) {
      this.logger.error('Failed to execute automated shift ending job', error);
    }
  }
}