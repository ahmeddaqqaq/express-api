import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/dto/pagination.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditAction, TransactionStatus } from '@prisma/client';
import { DateUtils } from '../utils/date-utils';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    technicianId: string,
    action: AuditAction,
    transactionId?: string,
    phase?: TransactionStatus,
    metadata?: any,
    description?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        technicianId,
        action,
        transactionId,
        phase,
        metadata,
        description,
      },
    });
  }

  async logShiftAction(technicianId: string, action: AuditAction) {
    return this.log(technicianId, action);
  }

  async logTransactionAction(
    technicianId: string,
    action: AuditAction,
    transactionId: string,
    phase?: TransactionStatus,
    metadata?: any,
    description?: string,
  ) {
    return this.log(
      technicianId,
      action,
      transactionId,
      phase,
      metadata,
      description,
    );
  }

  async logPhaseTransition(
    technicianId: string,
    transactionId: string,
    fromPhase: TransactionStatus,
    toPhase: TransactionStatus,
  ) {
    return this.log(
      technicianId,
      AuditAction.PHASE_TRANSITION,
      transactionId,
      toPhase,
      { fromPhase, toPhase },
      `Transaction phase changed from ${fromPhase} to ${toPhase}`,
    );
  }

  async findAll({ paginationDto }: { paginationDto: PaginationDto }) {
    const count = await this.prisma.auditLog.count();

    const auditLogs = await this.prisma.auditLog.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      include: {
        technician: true,
        transaction: {
          include: {
            customer: true,
            car: {
              include: {
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: auditLogs,
    };
  }

  async findByTransaction(transactionId: string) {
    return this.prisma.auditLog.findMany({
      where: { transactionId },
      include: {
        technician: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async findByTechnician(technicianId: string, paginationDto?: PaginationDto) {
    const where = { technicianId };

    if (paginationDto) {
      const count = await this.prisma.auditLog.count({ where });

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        skip: paginationDto.skip,
        take: paginationDto.take,
        include: {
          transaction: {
            include: {
              customer: true,
              car: {
                include: {
                  brand: true,
                  model: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      return {
        rows: count,
        skip: paginationDto.skip,
        take: paginationDto.take,
        data: auditLogs,
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        transaction: {
          include: {
            customer: true,
            car: {
              include: {
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
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
    const dateObj = new Date(date);
    const startOfDay = DateUtils.getStartOfDayUTC3(dateObj);
    const endOfDay = DateUtils.getEndOfDayUTC3(dateObj);

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
      logs: logs.map((log) => ({
        action: log.action,
        timestamp: log.timestamp,
      })),
    };
  }

  // Technician Assignment Methods
  async assignTechnicianToPhase(
    technicianId: string,
    transactionId: string,
    phase: TransactionStatus,
  ) {
    // Create or update assignment
    const assignment = await this.prisma.technicianAssignment.upsert({
      where: {
        technicianId_transactionId_phase: {
          technicianId,
          transactionId,
          phase,
        },
      },
      update: {
        isActive: true,
        assignedAt: new Date(),
      },
      create: {
        technicianId,
        transactionId,
        phase,
        isActive: true,
      },
    });

    // Log the assignment
    await this.logTransactionAction(
      technicianId,
      AuditAction.TRANSACTION_ASSIGNED,
      transactionId,
      phase,
      { assignmentId: assignment.id },
      `Technician assigned to ${phase} phase`,
    );

    return assignment;
  }

  async startWorkOnTransaction(
    technicianId: string,
    transactionId: string,
    phase: TransactionStatus,
  ) {
    // Update assignment with start time
    const assignment = await this.prisma.technicianAssignment.updateMany({
      where: {
        technicianId,
        transactionId,
        phase,
        isActive: true,
      },
      data: {
        startedAt: new Date(),
      },
    });

    // Log the start
    await this.logTransactionAction(
      technicianId,
      AuditAction.TRANSACTION_STARTED,
      transactionId,
      phase,
      {},
      `Started working on ${phase} phase`,
    );

    return assignment;
  }

  async completeWorkOnTransaction(
    technicianId: string,
    transactionId: string,
    phase: TransactionStatus,
  ) {
    // Update assignment with completion time
    const assignment = await this.prisma.technicianAssignment.updateMany({
      where: {
        technicianId,
        transactionId,
        phase,
        isActive: true,
      },
      data: {
        completedAt: new Date(),
        isActive: false,
      },
    });

    // Log the completion
    await this.logTransactionAction(
      technicianId,
      AuditAction.TRANSACTION_COMPLETED,
      transactionId,
      phase,
      {},
      `Completed work on ${phase} phase`,
    );

    return assignment;
  }

  async getTransactionAssignments(transactionId: string) {
    return this.prisma.technicianAssignment.findMany({
      where: { transactionId },
      include: {
        technician: true,
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });
  }

  async getTechnicianAssignments(technicianId: string, isActive?: boolean) {
    const where: any = { technicianId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.technicianAssignment.findMany({
      where,
      include: {
        transaction: {
          include: {
            customer: true,
            car: {
              include: {
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async getTransactionWorkHistory(transactionId: string) {
    const assignments = await this.getTransactionAssignments(transactionId);
    const auditLogs = await this.findByTransaction(transactionId);

    return {
      assignments,
      auditLogs,
      timeline: [...assignments, ...auditLogs].sort((a, b) => {
        const timeA = 'assignedAt' in a ? a.assignedAt : a.timestamp;
        const timeB = 'assignedAt' in b ? b.assignedAt : b.timestamp;
        return timeA.getTime() - timeB.getTime();
      }),
    };
  }
}
