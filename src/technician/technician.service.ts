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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

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
    const overtimeTime = this.calculateDuration(shift.overtimeStart, shift.overtimeEnd);
    
    const totalMinutes = shiftTime.minutes + overtimeTime.minutes - breakTime.minutes;
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
    const shifts = await this.prisma.shift.findMany({
      where: { technicianId },
    });

    let totalShiftMinutes = 0;
    let totalBreakMinutes = 0;
    let totalOvertimeMinutes = 0;

    for (const shift of shifts) {
      const shiftDuration = this.calculateDuration(shift.startTime, shift.endTime);
      const breakDuration = this.calculateDuration(shift.breakStart, shift.breakEnd);
      const overtimeDuration = this.calculateDuration(shift.overtimeStart, shift.overtimeEnd);

      totalShiftMinutes += shiftDuration.minutes;
      totalBreakMinutes += breakDuration.minutes;
      totalOvertimeMinutes += overtimeDuration.minutes;
    }

    return {
      totalShiftTime: this.formatDuration(totalShiftMinutes),
      totalBreakTime: this.formatDuration(totalBreakMinutes),
      totalOvertimeTime: this.formatDuration(totalOvertimeMinutes),
    };
  }

  private calculateDuration(startTime: Date | null, endTime: Date | null): { minutes: number } {
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
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
