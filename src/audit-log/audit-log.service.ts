import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(technicianId: string, action: string) {
    return this.prisma.auditLog.create({
      data: {
        technicianId,
        action,
      },
    });
  }

  async findAll({ paginationDto }: { paginationDto: PaginationDto }) {
    const count = await this.prisma.auditLog.count();

    const auditLogs = await this.prisma.auditLog.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      include: {
        technician: true,
      },
    });

    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: auditLogs,
    };
  }

  async getTechnicianDurations(technicianId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { technicianId },
      orderBy: { timestamp: 'asc' },
    });

    let totalShiftMs = 0;
    let totalBreakMs = 0;
    let totalOvertimeMs = 0;

    let shiftStart: Date | null = null;
    let breakStart: Date | null = null;
    let overtimeStart: Date | null = null;

    for (const log of logs) {
      const ts = new Date(log.timestamp);

      switch (log.action) {
        case 'SHIFT_STARTED':
          shiftStart = ts;
          break;
        case 'SHIFT_ENDED':
          if (shiftStart) {
            totalShiftMs += ts.getTime() - shiftStart.getTime();
            shiftStart = null;
          }
          break;
        case 'BREAK_STARTED':
          breakStart = ts;
          break;
        case 'BREAK_ENDED':
          if (breakStart) {
            totalBreakMs += ts.getTime() - breakStart.getTime();
            breakStart = null;
          }
          break;
        case 'OVERTIME_STARTED':
          overtimeStart = ts;
          break;
        case 'OVERTIME_ENDED':
          if (overtimeStart) {
            totalOvertimeMs += ts.getTime() - overtimeStart.getTime();
            overtimeStart = null;
          }
          break;
      }
    }

    // Helper function to convert milliseconds to HH:MM:SS format
    const msToTimeString = (ms: number): string => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return {
      totalShiftTime: msToTimeString(totalShiftMs),
      totalBreakTime: msToTimeString(totalBreakMs),
      totalOvertimeTime: msToTimeString(totalOvertimeMs),
    };
  }

  async getDailyWorkingHours(technicianId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        technicianId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    let totalShiftMs = 0;
    let totalBreakMs = 0;
    let totalOvertimeMs = 0;

    let shiftStart: Date | null = null;
    let breakStart: Date | null = null;
    let overtimeStart: Date | null = null;

    for (const log of logs) {
      const ts = new Date(log.timestamp);

      switch (log.action) {
        case 'SHIFT_STARTED':
          shiftStart = ts;
          break;
        case 'SHIFT_ENDED':
          if (shiftStart) {
            totalShiftMs += ts.getTime() - shiftStart.getTime();
            shiftStart = null;
          }
          break;
        case 'BREAK_STARTED':
          breakStart = ts;
          break;
        case 'BREAK_ENDED':
          if (breakStart) {
            totalBreakMs += ts.getTime() - breakStart.getTime();
            breakStart = null;
          }
          break;
        case 'OVERTIME_STARTED':
          overtimeStart = ts;
          break;
        case 'OVERTIME_ENDED':
          if (overtimeStart) {
            totalOvertimeMs += ts.getTime() - overtimeStart.getTime();
            overtimeStart = null;
          }
          break;
      }
    }

    // Helper function to convert milliseconds to HH:MM:SS format
    const msToTimeString = (ms: number): string => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return {
      date,
      shiftTime: msToTimeString(totalShiftMs),
      breakTime: msToTimeString(totalBreakMs),
      overtimeTime: msToTimeString(totalOvertimeMs),
      totalWorkingTime: msToTimeString(totalShiftMs + totalOvertimeMs),
      logs: logs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
      })),
    };
  }
}
