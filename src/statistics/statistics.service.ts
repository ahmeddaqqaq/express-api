import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatsFilterDto, TimeRange } from './models/stats-filter.dto';
import { DateUtils } from '../utils/date-utils';
import {
  AddOnRevenue,
  RevenueSummary,
  ServiceRevenue,
} from './models/revenue.response';
import { TopCustomer } from './models/top-customer-response';
import {
  PeakHoursResponse,
  PeakDaysResponse,
  TechnicianUtilizationResponse,
  ServiceStageBottleneckResponse,
  PeakAnalysisResponse,
} from './models/operational-insights.response';
import {
  DailyReportResponseDto,
  TechnicianShiftReport,
  CashSummary,
  SupervisorSalesReport,
} from './models/daily-report.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private getStartOfDayUTC3(date: Date): Date {
    return DateUtils.getStartOfDayUTC3(date);
  }

  private getEndOfDayUTC3(date: Date): Date {
    return DateUtils.getEndOfDayUTC3(date);
  }

  private getDateRange(filter: StatsFilterDto): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (filter.customStart && filter.customEnd) {
      return { start: filter.customStart, end: filter.customEnd };
    }

    switch (filter.range) {
      case TimeRange.DAY:
        start = this.getStartOfDayUTC3(now);
        break;
      case TimeRange.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case TimeRange.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case TimeRange.ALL:
      default:
        start = new Date(0); // Unix epoch
        break;
    }

    return { start, end };
  }

  async getDashboardStatistics(filter?: StatsFilterDto) {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const [
      activeCustomers,
      completedTransactions,
      newCustomers,
      completedTransactionsCount,
      scheduledTransactions,
      inProgressTransaction,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: {
          isActive: true,
          createdAt: { lte: end },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'completed',
          updatedAt: { lte: end },
        },
      }),
      this.prisma.customer.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'scheduled',
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          OR: [
            { status: 'stageOne' },
            { status: 'stageTwo' },
            { status: 'stageThree' },
          ],
          updatedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    return {
      activeCustomers,
      completedTransactions,
      newCustomers,
      completedTransactionsCount,
      scheduledTransactions,
      inProgressTransaction,
    };
  }

  async serviceCompletion(filter?: StatsFilterDto) {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const [completedTrx, cancelledTrx] = await Promise.all([
      this.prisma.transaction.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'cancelled',
          updatedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);

    const ratio =
      completedTrx > 0
        ? ((completedTrx - cancelledTrx) / completedTrx) * 100
        : 0;

    return { completionRatio: ratio };
  }

  async getRevenueStatistics(filter?: StatsFilterDto): Promise<RevenueSummary> {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    // Get all completed transactions in the time range
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'completed',
        updatedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: true,
        addOns: true,
        invoice: true,
        car: {
          include: {
            model: true,
          },
        },
      },
    });

    // Calculate service revenue
    const serviceMap = new Map<string, ServiceRevenue>();

    // Calculate add-on revenue
    const addOnMap = new Map<string, AddOnRevenue>();

    let totalRevenue = 0;
    let serviceRevenue = 0;
    let addOnRevenue = 0;

    for (const trx of transactions) {
      if (!trx.invoice) continue;

      totalRevenue += trx.invoice.totalAmount;

      // Service revenue
      const serviceKey = trx.serviceId;
      if (!serviceMap.has(serviceKey)) {
        serviceMap.set(serviceKey, {
          serviceId: trx.serviceId,
          serviceName: trx.service.name,
          count: 0,
          totalRevenue: 0,
        });
      }
      const serviceEntry = serviceMap.get(serviceKey);
      serviceEntry.count += 1;
      // Assuming service price is the main component of the invoice
      // You might need to adjust this based on your actual pricing structure
      const serviceAmount =
        trx.invoice.totalAmount -
        (trx.addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0);
      serviceEntry.totalRevenue += serviceAmount;
      serviceRevenue += serviceAmount;

      // Add-on revenue
      for (const addOn of trx.addOns) {
        const addOnKey = addOn.id;
        if (!addOnMap.has(addOnKey)) {
          addOnMap.set(addOnKey, {
            addOnId: addOn.id,
            addOnName: addOn.name,
            count: 0,
            totalRevenue: 0,
          });
        }
        const addOnEntry = addOnMap.get(addOnKey);
        addOnEntry.count += 1;
        addOnEntry.totalRevenue += addOn.price;
        addOnRevenue += addOn.price;
      }
    }

    return {
      totalRevenue,
      serviceRevenue,
      addOnRevenue,
      services: Array.from(serviceMap.values()),
      addOns: Array.from(addOnMap.values()),
    };
  }

  async getTopCustomers(
    filter?: StatsFilterDto,
    limit = 5,
  ): Promise<TopCustomer[]> {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const customers = await this.prisma.customer.findMany({
      where: {
        transactions: {
          some: {
            status: 'completed',
            updatedAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
      include: {
        transactions: {
          where: {
            status: 'completed',
            updatedAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            invoice: true,
          },
        },
      },
    });

    const customersWithStats = customers.map((customer) => {
      const totalSpent = customer.transactions.reduce(
        (sum, trx) => sum + (trx.invoice?.totalAmount || 0),
        0,
      );

      return {
        customerId: customer.id,
        customerName: `${customer.fName} ${customer.lName}`,
        mobileNumber: customer.mobileNumber,
        totalSpent,
        transactionCount: customer.transactions.length,
      };
    });

    // Sort by total spent descending
    customersWithStats.sort((a, b) => b.totalSpent - a.totalSpent);

    return customersWithStats.slice(0, limit);
  }

  async getPeakAnalysis(
    filter?: StatsFilterDto,
  ): Promise<PeakAnalysisResponse> {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Peak Hours Analysis
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
    });

    const totalTransactions = transactions.length;

    // Convert to response format
    const peakHours: PeakHoursResponse[] = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hour,
        transactionCount: count,
        percentage:
          totalTransactions > 0 ? (count / totalTransactions) * 100 : 0,
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);

    const peakDays: PeakDaysResponse[] = Array.from(dayCounts.entries())
      .map(([dayOfWeek, count]) => ({
        dayOfWeek,
        dayName: dayNames[dayOfWeek],
        transactionCount: count,
        percentage:
          totalTransactions > 0 ? (count / totalTransactions) * 100 : 0,
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);

    return {
      peakHours,
      peakDays,
    };
  }

  async getTechnicianUtilization(
    filter?: StatsFilterDto,
  ): Promise<TechnicianUtilizationResponse[]> {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const technicians = await this.prisma.technician.findMany({
      where: {
        status: true, // Only active technicians
      },
      include: {
        transactions: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const utilizationData: TechnicianUtilizationResponse[] = technicians.map(
      (technician) => {
        const totalTransactions = technician.transactions.length;
        const completedTransactions = technician.transactions.filter(
          (t) => t.status === 'completed',
        ).length;
        const inProgressTransactions = technician.transactions.filter((t) =>
          ['stageOne', 'stageTwo', 'stageThree'].includes(t.status),
        ).length;

        // Calculate utilization rate based on total transactions assigned
        const utilizationRate =
          totalTransactions > 0
            ? (totalTransactions / Math.max(totalTransactions, 1)) * 100
            : 0;
        const completionRate =
          totalTransactions > 0
            ? (completedTransactions / totalTransactions) * 100
            : 0;

        return {
          technicianId: technician.id,
          technicianName: `${technician.fName} ${technician.lName}`,
          totalTransactions,
          completedTransactions,
          inProgressTransactions,
          utilizationRate,
          completionRate,
        };
      },
    );

    return utilizationData.sort(
      (a, b) => b.utilizationRate - a.utilizationRate,
    );
  }

  async getServiceStageBottlenecks(
    filter?: StatsFilterDto,
  ): Promise<ServiceStageBottleneckResponse[]> {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    // Get all transactions with their stage progression
    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: {
          in: ['stageOne', 'stageTwo', 'stageThree', 'completed'],
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate average time in each stage
    const stageStats = {
      scheduled: { totalTime: 0, count: 0 },
      stageOne: { totalTime: 0, count: 0 },
      stageTwo: { totalTime: 0, count: 0 },
      stageThree: { totalTime: 0, count: 0 },
    };

    transactions.forEach((transaction) => {
      const createdTime = new Date(transaction.createdAt).getTime();
      const updatedTime = new Date(transaction.updatedAt).getTime();
      const timeInStage = (updatedTime - createdTime) / (1000 * 60 * 60); // Convert to hours

      if (transaction.status in stageStats) {
        stageStats[transaction.status].totalTime += timeInStage;
        stageStats[transaction.status].count += 1;
      }
    });

    // Calculate bottleneck scores and averages
    const bottleneckData: ServiceStageBottleneckResponse[] = Object.entries(
      stageStats,
    ).map(([stage, stats]) => {
      const averageTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
      const bottleneckScore = averageTime * stats.count; // Higher time and count = higher bottleneck

      return {
        stage,
        averageTimeInStage: averageTime,
        transactionCount: stats.count,
        bottleneckScore,
      };
    });

    return bottleneckData.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  async getSupervisorAddsOnSell(filter?: StatsFilterDto) {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: new Date(),
        };

    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'completed',
        updatedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        addOns: true,
        createdBy: true,
      },
    });

    const supervisorAddOnSales = new Map<
      string,
      {
        supervisorId: string;
        supervisorName: string;
        totalAddOnRevenue: number;
        addOnCount: number;
      }
    >();

    for (const transaction of transactions) {
      if (
        !transaction.createdBy ||
        !transaction.addOns ||
        transaction.addOns.length === 0
      ) {
        continue;
      }

      const supervisorKey = transaction.createdBy.id;
      const supervisorName = `${transaction.createdBy.firstName} ${transaction.createdBy.lastName}`;

      if (!supervisorAddOnSales.has(supervisorKey)) {
        supervisorAddOnSales.set(supervisorKey, {
          supervisorId: transaction.createdBy.id,
          supervisorName,
          totalAddOnRevenue: 0,
          addOnCount: 0,
        });
      }

      const supervisorEntry = supervisorAddOnSales.get(supervisorKey);
      const addOnRevenue = transaction.addOns.reduce(
        (sum, addOn) => sum + addOn.price,
        0,
      );

      supervisorEntry.totalAddOnRevenue += addOnRevenue;
      supervisorEntry.addOnCount += transaction.addOns.length;
    }

    return Array.from(supervisorAddOnSales.values()).sort(
      (a, b) => b.totalAddOnRevenue - a.totalAddOnRevenue,
    );
  }

  async getDailyReport(date: string): Promise<DailyReportResponseDto> {
    const reportDate = new Date(date);
    const startOfDay = this.getStartOfDayUTC3(reportDate);
    const endOfDay = this.getEndOfDayUTC3(reportDate);

    // Get all technicians with their shifts for the specific date
    const technicians = await this.prisma.technician.findMany({
      include: {
        shifts: {
          where: {
            date: startOfDay, // Shifts are stored with exact startOfDay date
          },
        },
      },
    });

    // Get technician shift reports
    const technicianShifts: TechnicianShiftReport[] = await Promise.all(
      technicians.map(async (technician) => {
        const shift = technician.shifts[0];
        
        if (!shift) {
          return {
            technicianId: technician.id,
            technicianName: `${technician.fName} ${technician.lName}`,
            totalShiftTime: '00:00:00',
            totalBreakTime: '00:00:00',
            totalOvertimeTime: '00:00:00',
            totalWorkingTime: '00:00:00',
            worked: false,
          };
        }

        const shiftTime = this.calculateDuration(shift.startTime, shift.endTime);
        const breakTime = this.calculateDuration(shift.breakStart, shift.breakEnd);
        const overtimeTime = this.calculateDuration(shift.overtimeStart, shift.overtimeEnd);
        
        const totalMinutes = Math.max(0, shiftTime.minutes + overtimeTime.minutes - breakTime.minutes);

        return {
          technicianId: technician.id,
          technicianName: `${technician.fName} ${technician.lName}`,
          totalShiftTime: this.formatDuration(shiftTime.minutes),
          totalBreakTime: this.formatDuration(breakTime.minutes),
          totalOvertimeTime: this.formatDuration(overtimeTime.minutes),
          totalWorkingTime: this.formatDuration(totalMinutes),
          worked: true,
        };
      }),
    );

    // Get completed transactions for cash calculations
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'completed',
        OR: [
          {
            updatedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
      include: {
        service: true,
        addOns: true,
        invoice: true,
        car: {
          include: {
            model: true,
          },
        },
        createdBy: true,
      },
    });

    // Calculate cash summary
    let servicesCash = 0;
    let addOnsCash = 0;
    let totalCash = 0;

    for (const transaction of transactions) {
      if (transaction.invoice) {
        totalCash += transaction.invoice.totalAmount;
        
        // Calculate service cash (total - add-ons)
        const addOnAmount = transaction.addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0;
        const serviceAmount = transaction.invoice.totalAmount - addOnAmount;
        
        servicesCash += serviceAmount;
        addOnsCash += addOnAmount;
      }
    }

    const cashSummary: CashSummary = {
      servicesCash,
      addOnsCash,
      totalCash,
      transactionCount: transactions.length,
    };

    // Get supervisor sales for the day
    const supervisorSalesMap = new Map<string, SupervisorSalesReport>();

    for (const transaction of transactions) {
      if (transaction.createdBy && transaction.addOns && transaction.addOns.length > 0) {
        const supervisorKey = transaction.createdBy.id;
        const supervisorName = `${transaction.createdBy.firstName} ${transaction.createdBy.lastName}`;

        if (!supervisorSalesMap.has(supervisorKey)) {
          supervisorSalesMap.set(supervisorKey, {
            supervisorId: transaction.createdBy.id,
            supervisorName,
            totalAddOnRevenue: 0,
            addOnCount: 0,
          });
        }

        const supervisorEntry = supervisorSalesMap.get(supervisorKey);
        const addOnRevenue = transaction.addOns.reduce((sum, addOn) => sum + addOn.price, 0);

        supervisorEntry.totalAddOnRevenue += addOnRevenue;
        supervisorEntry.addOnCount += transaction.addOns.length;
      }
    }

    const supervisorSales = Array.from(supervisorSalesMap.values()).sort(
      (a, b) => b.totalAddOnRevenue - a.totalAddOnRevenue,
    );

    return {
      date,
      technicianShifts,
      cashSummary,
      supervisorSales,
      generatedAt: new Date().toISOString(),
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

    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
