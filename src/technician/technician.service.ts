import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician-dto';
import { TechnicianFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma, AuditAction } from '@prisma/client';
import { TechnicianManyResponse } from './dto/response';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@Injectable()
export class TechnicianService {
  constructor(
    private prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createTechnicianDto: CreateTechnicianDto) {
    await this.prisma.technician.create({ data: createTechnicianDto });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    filterDto: TechnicianFilterDto;
    paginationDto: PaginationDto;
  }): Promise<TechnicianManyResponse> {
    const where: Prisma.TechnicianWhereInput = {};

    const count = await this.prisma.technician.count({
      where,
    });

    const techniciansRaw = await this.prisma.technician.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
      include: {
        auditLog: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        shifts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const technicians = techniciansRaw.map((tech) => ({
      id: tech.id,
      fName: tech.fName,
      lName: tech.lName,
      status: tech.status,
      createdAt: tech.createdAt,
      updatedAt: tech.updatedAt,
      lastAction: tech.auditLog[0]?.action ?? null,
    }));

    const enriched = await Promise.all(
      technicians.map(async (tech) => {
        const durations = await this.getShiftDurations(tech.id);
        return {
          ...tech,
          totalShiftTime: durations.totalShiftTime,
          totalBreakTime: durations.totalBreakTime,
          totalOvertimeTime: durations.totalOvertimeTime,
        };
      }),
    );

    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: enriched,
    };
  }

  async startShift(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (existingShift && existingShift.startTime && !existingShift.endTime) {
      throw new Error('Shift already started and not ended.');
    }

    if (existingShift) {
      await this.prisma.shift.update({
        where: { id: existingShift.id },
        data: {
          startTime: new Date(),
          endTime: null,
        },
      });
    } else {
      await this.prisma.shift.create({
        data: {
          technicianId: id,
          date: today,
          startTime: new Date(),
          shiftType: 'REGULAR',
        },
      });
    }

    await this.auditLogService.logShiftAction(id, AuditAction.SHIFT_STARTED);
  }

  async endShift(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (!existingShift || !existingShift.startTime) {
      throw new Error('Shift has not started yet.');
    }
    if (existingShift.endTime) {
      throw new Error('Shift already ended.');
    }

    await this.prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        endTime: new Date(),
      },
    });

    await this.auditLogService.logShiftAction(id, AuditAction.SHIFT_ENDED);
  }

  async startBreak(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (!existingShift || !existingShift.startTime) {
      throw new Error('Cannot start break without an active shift.');
    }
    if (existingShift.breakStart && !existingShift.breakEnd) {
      throw new Error('Break already started and not ended.');
    }

    await this.prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        breakStart: new Date(),
        breakEnd: null,
      },
    });

    await this.auditLogService.logShiftAction(id, AuditAction.BREAK_STARTED);
  }

  async endBreak(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (!existingShift || !existingShift.breakStart) {
      throw new Error('Break has not started yet.');
    }
    if (existingShift.breakEnd) {
      throw new Error('Break already ended.');
    }

    await this.prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        breakEnd: new Date(),
      },
    });

    await this.auditLogService.logShiftAction(id, AuditAction.BREAK_ENDED);
  }

  async update(id: string, updateTechnicianDto: CreateTechnicianDto) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    return this.prisma.technician.update({
      where: { id },
      data: updateTechnicianDto,
    });
  }

  async startOvertime(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (!existingShift || !existingShift.startTime) {
      throw new Error('Cannot start overtime without an active shift.');
    }
    if (existingShift.overtimeStart && !existingShift.overtimeEnd) {
      throw new Error('Overtime already started and not ended.');
    }

    await this.prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        overtimeStart: new Date(),
        overtimeEnd: null,
      },
    });

    await this.auditLogService.logShiftAction(id, AuditAction.OVERTIME_STARTED);
  }

  async endOvertime(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const today = this.getStartOfDayUTC3(new Date());

    const existingShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: today,
        },
      },
    });

    if (!existingShift || !existingShift.overtimeStart) {
      throw new Error('Overtime has not started yet.');
    }
    if (existingShift.overtimeEnd) {
      throw new Error('Overtime already ended.');
    }

    await this.prisma.shift.update({
      where: { id: existingShift.id },
      data: {
        overtimeEnd: new Date(),
      },
    });

    await this.auditLogService.logShiftAction(id, AuditAction.OVERTIME_ENDED);
  }

  async getDailyWorkingHours(id: string, date: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    const targetDate = this.getStartOfDayUTC3(new Date(date));

    const shift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: id,
          date: targetDate,
        },
      },
    });

    if (!shift) {
      return {
        date: date,
        shiftTime: '00:00:00',
        breakTime: '00:00:00',
        overtimeTime: '00:00:00',
        totalWorkingTime: '00:00:00',
      };
    }

    const shiftTime = this.calculateDuration(shift.startTime, shift.endTime);
    const breakTime = this.calculateDuration(shift.breakStart, shift.breakEnd);
    const overtimeTime = this.calculateDuration(
      shift.overtimeStart,
      shift.overtimeEnd,
    );

    const totalMinutes =
      shiftTime.minutes + overtimeTime.minutes - breakTime.minutes;
    const totalWorkingTime = this.formatDuration(totalMinutes);

    return {
      date: date,
      shiftTime: this.formatDuration(shiftTime.minutes),
      breakTime: this.formatDuration(breakTime.minutes),
      overtimeTime: this.formatDuration(overtimeTime.minutes),
      totalWorkingTime: totalWorkingTime,
    };
  }

  async delete(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');

    return this.prisma.technician.delete({ where: { id } });
  }

  private async getShiftDurations(technicianId: string) {
    const today = this.getStartOfDayUTC3(new Date());

    const todayShift = await this.prisma.shift.findUnique({
      where: {
        technicianId_date: {
          technicianId: technicianId,
          date: today,
        },
      },
    });

    if (!todayShift) {
      return {
        totalShiftTime: '00:00:00',
        totalBreakTime: '00:00:00',
        totalOvertimeTime: '00:00:00',
      };
    }

    const shiftDuration = this.calculateDuration(
      todayShift.startTime,
      todayShift.endTime,
    );
    const breakDuration = this.calculateDuration(
      todayShift.breakStart,
      todayShift.breakEnd,
    );
    const overtimeDuration = this.calculateDuration(
      todayShift.overtimeStart,
      todayShift.overtimeEnd,
    );

    return {
      totalShiftTime: this.formatDuration(shiftDuration.minutes),
      totalBreakTime: this.formatDuration(breakDuration.minutes),
      totalOvertimeTime: this.formatDuration(overtimeDuration.minutes),
    };
  }

  private calculateDuration(
    startTime: Date | null,
    endTime: Date | null,
  ): { minutes: number } {
    if (!startTime) return { minutes: 0 };

    const end = endTime || new Date();
    const diffMs = end.getTime() - startTime.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));

    return { minutes: Math.max(0, minutes) };
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = 0;

    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async findActiveShiftTechnicians() {
    const today = this.getStartOfDayUTC3(new Date());

    const activeShifts = await this.prisma.shift.findMany({
      where: {
        date: today,
        startTime: { not: null },
        OR: [
          { endTime: null }, // Shift hasn't ended
          { overtimeStart: { not: null }, overtimeEnd: null }, // Overtime is active
        ],
      },
      include: {
        technician: true,
      },
    });

    return activeShifts.map((shift) => shift.technician);
  }

  async autoEndOpenShifts() {
    const currentTime = new Date();
    console.log(
      `[${currentTime.toISOString()}] Auto-ending open shifts, breaks, and overtimes...`,
    );

    // Find all shifts that have started but not ended (open shifts)
    const openShifts = await this.prisma.shift.findMany({
      where: {
        startTime: { not: null },
        endTime: null,
      },
      include: {
        technician: true,
      },
    });

    // Find all active breaks (started but not ended)
    const activeBreaks = await this.prisma.shift.findMany({
      where: {
        breakStart: { not: null },
        breakEnd: null,
      },
      include: {
        technician: true,
      },
    });

    // Find all active overtimes (started but not ended)
    const activeOvertimes = await this.prisma.shift.findMany({
      where: {
        overtimeStart: { not: null },
        overtimeEnd: null,
      },
      include: {
        technician: true,
      },
    });

    let endedShifts = 0;
    let endedBreaks = 0;
    let endedOvertimes = 0;

    // End all active breaks first
    for (const shift of activeBreaks) {
      try {
        await this.prisma.shift.update({
          where: { id: shift.id },
          data: { breakEnd: currentTime },
        });

        await this.auditLogService.logShiftAction(
          shift.technicianId,
          AuditAction.BREAK_ENDED,
        );

        endedBreaks++;
        console.log(
          `Auto-ended break for technician: ${shift.technician.fName} ${shift.technician.lName}`,
        );
      } catch (error) {
        console.error(`Failed to end break for shift ${shift.id}:`, error);
      }
    }

    // End all active overtimes
    for (const shift of activeOvertimes) {
      try {
        await this.prisma.shift.update({
          where: { id: shift.id },
          data: { overtimeEnd: currentTime },
        });

        await this.auditLogService.logShiftAction(
          shift.technicianId,
          AuditAction.OVERTIME_ENDED,
        );

        endedOvertimes++;
        console.log(
          `Auto-ended overtime for technician: ${shift.technician.fName} ${shift.technician.lName}`,
        );
      } catch (error) {
        console.error(`Failed to end overtime for shift ${shift.id}:`, error);
      }
    }

    // End all open shifts
    for (const shift of openShifts) {
      try {
        await this.prisma.shift.update({
          where: { id: shift.id },
          data: { endTime: currentTime },
        });

        await this.auditLogService.logShiftAction(
          shift.technicianId,
          AuditAction.SHIFT_ENDED,
        );

        endedShifts++;
        console.log(
          `Auto-ended shift for technician: ${shift.technician.fName} ${shift.technician.lName}`,
        );
      } catch (error) {
        console.error(`Failed to end shift ${shift.id}:`, error);
      }
    }

    const summary = {
      timestamp: currentTime.toISOString(),
      endedShifts,
      endedBreaks,
      endedOvertimes,
      totalActions: endedShifts + endedBreaks + endedOvertimes,
    };

    console.log(`Auto-end completed:`, summary);
    return summary;
  }

  private getStartOfDayUTC3(date: Date): Date {
    // Create start of day in UTC+3 timezone
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    // Subtract 3 hours to convert UTC+3 to UTC
    startOfDay.setTime(startOfDay.getTime() - 4 * 60 * 60 * 1000);
    return startOfDay;
  }
}
