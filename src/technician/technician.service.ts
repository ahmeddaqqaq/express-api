import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician-dto';
import { TechnicianFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma } from '@prisma/client';
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
        const durations = await this.auditLogService.getTechnicianDurations(
          tech.id,
        );
        return {
          ...tech,
          totalShiftTime: durations.totalShiftTime,
          totalBreakTime: durations.totalBreakTime,
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
    if (tech.startShift && !tech.endShift)
      throw new Error('Shift already started and not ended.');

    await this.prisma.technician.update({
      where: { id },
      data: {
        startShift: new Date(),
        endShift: null,
      },
    });
    await this.auditLogService.log(id, 'SHIFT_STARTED');
  }

  async endShift(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });

    if (!tech) throw new Error('Technician not found.');
    if (!tech.startShift) throw new Error('Shift has not started yet.');
    if (tech.endShift) throw new Error('Shift already ended.');

    await this.prisma.technician.update({
      where: { id },
      data: {
        endShift: new Date(),
      },
    });
    await this.auditLogService.log(id, 'SHIFT_ENDED');
  }

  async startBreak(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });

    if (!tech) throw new Error('Technician not found.');
    if (tech.startBreak && !tech.endBreak)
      throw new Error('Break already started and not ended.');

    await this.prisma.technician.update({
      where: { id },
      data: {
        startBreak: new Date(),
        endBreak: null,
      },
    });
    await this.auditLogService.log(id, 'BREAK_STARTED');
  }

  async endBreak(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });

    if (!tech) throw new Error('Technician not found.');
    if (!tech.startBreak) throw new Error('Break has not started yet.');
    if (tech.endBreak) throw new Error('Break already ended.');

    await this.prisma.technician.update({
      where: { id },
      data: {
        endBreak: new Date(),
      },
    });
    await this.auditLogService.log(id, 'BREAK_ENDED');
  }

  async update(id: string, updateTechnicianDto: CreateTechnicianDto) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');
    
    return this.prisma.technician.update({
      where: { id },
      data: updateTechnicianDto,
    });
  }

  async delete(id: string) {
    const tech = await this.prisma.technician.findUnique({ where: { id } });
    if (!tech) throw new Error('Technician not found.');
    
    return this.prisma.technician.delete({ where: { id } });
  }
}
