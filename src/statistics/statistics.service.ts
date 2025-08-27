import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SalesRecordService } from 'src/sales-record/sales-record.service';
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
  UserSalesReport,
} from './models/daily-report.dto';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    public salesRecordService: SalesRecordService,
  ) {}

  private getStartOfDayUTC3(date: Date): Date {
    return DateUtils.getStartOfDayUTC3(date);
  }

  private getEndOfDayUTC3(date: Date): Date {
    return DateUtils.getEndOfDayUTC3(date);
  }

  private getDateRange(filter: StatsFilterDto): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (filter.customStart && filter.customEnd) {
      // Apply business day boundaries to custom dates
      return {
        start: this.getStartOfDayUTC3(filter.customStart),
        end: this.getEndOfDayUTC3(filter.customEnd),
      };
    }

    // End time should always be the end of current business day
    end = this.getEndOfDayUTC3(now);

    switch (filter.range) {
      case TimeRange.DAY:
        // Current business day
        start = this.getStartOfDayUTC3(now);
        break;
      case TimeRange.MONTH:
        // Start of current month with business day boundary
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        start = this.getStartOfDayUTC3(startOfMonth);
        break;
      case TimeRange.YEAR:
        // Start of current year with business day boundary
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        start = this.getStartOfDayUTC3(startOfYear);
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
          end: this.getEndOfDayUTC3(new Date()),
        };

    const [
      activeCustomers,
      completedTransactions,
      newCustomers,
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
          updatedAt: {
            gte: start,
            lte: end,
          },
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
      scheduledTransactions,
      inProgressTransaction,
    };
  }

  async serviceCompletion(filter?: StatsFilterDto) {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: this.getEndOfDayUTC3(new Date()),
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
          end: this.getEndOfDayUTC3(new Date()),
        };

    // Get all sales records for completed transactions in the time range
    const salesRecords = await this.salesRecordService.getSalesForPeriod(
      start,
      end,
      undefined, // No specific seller filter
      undefined, // No specific sale type filter
    );

    // Filter for completed transactions only
    const completedSales = salesRecords.filter(
      (sale) => sale.transaction && sale.transaction.status === 'completed',
    );

    // Calculate service revenue
    const serviceMap = new Map<string, ServiceRevenue>();

    // Calculate add-on revenue
    const addOnMap = new Map<string, AddOnRevenue>();

    let totalRevenue = 0;
    let serviceRevenue = 0;
    let addOnRevenue = 0;

    for (const sale of completedSales) {
      const saleTotal = sale.price * sale.quantity;
      totalRevenue += saleTotal;

      if (sale.saleType === 'SERVICE') {
        serviceRevenue += saleTotal;

        const serviceKey = sale.itemId;
        if (!serviceMap.has(serviceKey)) {
          serviceMap.set(serviceKey, {
            serviceId: sale.itemId,
            serviceName: sale.itemName,
            count: 0,
            totalRevenue: 0,
          });
        }
        const serviceEntry = serviceMap.get(serviceKey);
        serviceEntry.count += sale.quantity;
        serviceEntry.totalRevenue += saleTotal;
      } else if (sale.saleType === 'ADDON') {
        addOnRevenue += saleTotal;

        const addOnKey = sale.itemId;
        if (!addOnMap.has(addOnKey)) {
          addOnMap.set(addOnKey, {
            addOnId: sale.itemId,
            addOnName: sale.itemName,
            count: 0,
            totalRevenue: 0,
          });
        }
        const addOnEntry = addOnMap.get(addOnKey);
        addOnEntry.count += sale.quantity;
        addOnEntry.totalRevenue += saleTotal;
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
          end: this.getEndOfDayUTC3(new Date()),
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
          end: this.getEndOfDayUTC3(new Date()),
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
      // Convert to Jordan time (UTC+3) for accurate peak hour analysis
      const jordanHour = (date.getUTCHours() + 3) % 24;
      const dayOfWeek = date.getUTCDay(); // Use UTC day to be consistent

      hourCounts.set(jordanHour, (hourCounts.get(jordanHour) || 0) + 1);
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
          end: this.getEndOfDayUTC3(new Date()),
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
          end: this.getEndOfDayUTC3(new Date()),
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

  async getUserAddOnSales(filter?: StatsFilterDto) {
    const { start, end } = filter
      ? this.getDateRange(filter)
      : {
          start: new Date(0),
          end: this.getEndOfDayUTC3(new Date()),
        };

    const salesRecords = await this.prisma.salesRecord.findMany({
      where: {
        saleType: 'ADDON',
        soldAt: {
          gte: start,
          lte: end,
        },
        transaction: {
          status: 'completed',
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const userAddOnSales = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalAddOnRevenue: number;
        addOnCount: number;
      }
    >();

    for (const record of salesRecords) {
      // Handle both users and sales persons
      const userKey = record.sellerId || record.salesPersonId;
      if (!userKey) continue; // Skip if neither is set

      let userName = '';
      if (record.seller) {
        userName = record.seller.name;
      } else if (record.salesPerson) {
        userName = `${record.salesPerson.firstName} ${record.salesPerson.lastName}`;
      }

      if (!userAddOnSales.has(userKey)) {
        userAddOnSales.set(userKey, {
          userId: userKey,
          userName,
          totalAddOnRevenue: 0,
          addOnCount: 0,
        });
      }

      const userEntry = userAddOnSales.get(userKey);
      userEntry.totalAddOnRevenue += record.price * record.quantity;
      userEntry.addOnCount += record.quantity;
    }

    return Array.from(userAddOnSales.values()).sort(
      (a, b) => b.totalAddOnRevenue - a.totalAddOnRevenue,
    );
  }

  async getDailyReport(date: string): Promise<DailyReportResponseDto> {
    const reportDate = new Date(date);
    const startOfDay = this.getStartOfDayUTC3(reportDate);
    const endOfDay = this.getEndOfDayUTC3(reportDate);

    // Get all technicians with their shifts for the specific date
    // IMPORTANT: When shifts are created, they use getStartOfDayUTC3() which returns
    // the business day start time (e.g., 2025-08-25T22:00:00.000Z for Aug 26 business day).
    // This gets stored in a Date field as 2025-08-25T00:00:00.000Z (one day earlier).
    //
    // So when user requests "2025-08-26", we need to query for "2025-08-25" in the database
    // to get the shifts that were created for the August 26 business day.
    const requestedDate = new Date(date + 'T00:00:00.000Z');
    const businessDate = new Date(requestedDate);
    businessDate.setUTCDate(businessDate.getUTCDate() - 1); // Go back one day to match how shifts are stored

    const technicians = await this.prisma.technician.findMany({
      include: {
        shifts: {
          where: {
            date: businessDate, // Shifts are stored with calendar date
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
            shiftStartTime: '00:00:00',
            shiftEndTime: '00:00:00',
            totalShiftTime: '00:00:00',
            totalBreakTime: '00:00:00',
            totalOvertimeTime: '00:00:00',
            totalWorkingTime: '00:00:00',
            overtimeCompensation: 0,
            worked: false,
          };
        }

        const shiftTime = this.calculateDuration(
          shift.startTime,
          shift.endTime,
        );
        const breakTime = this.calculateDuration(
          shift.breakStart,
          shift.breakEnd,
        );
        const overtimeTime = this.calculateDuration(
          shift.overtimeStart,
          shift.overtimeEnd,
        );

        const totalMinutes = Math.max(
          0,
          shiftTime.minutes + overtimeTime.minutes - breakTime.minutes,
        );

        // Calculate overtime compensation (overtime minutes * 0.025 per minute)
        const overtimeCompensation = overtimeTime.minutes * 0.025;
        // Format shift start and end times
        const shiftStartTime = shift.startTime
          ? shift.startTime
              .toLocaleTimeString('en-US', {
                timeZone: 'Asia/Amman',
                hour12: false, // Set to false if you prefer 24-hour format
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              .slice(0, 8)
          : '00:00:00';
        const shiftEndTime = shift.endTime
          ? shift.endTime
              .toLocaleTimeString('en-US', {
                timeZone: 'Asia/Amman',
                hour12: false, // Set to false if you prefer 24-hour format
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
              .slice(0, 8)
          : '00:00:00';

        return {
          technicianId: technician.id,
          technicianName: `${technician.fName} ${technician.lName}`,
          shiftStartTime,
          shiftEndTime,
          totalShiftTime: this.formatDuration(shiftTime.minutes),
          totalBreakTime: this.formatDuration(breakTime.minutes),
          totalOvertimeTime: this.formatDuration(overtimeTime.minutes),
          totalWorkingTime: this.formatDuration(totalMinutes),
          overtimeCompensation,
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
        createdByUser: true,
      },
    });

    // Calculate cash summary from SalesRecord table
    const salesForDay = await this.salesRecordService.getSalesForPeriod(
      startOfDay,
      endOfDay,
      undefined, // No specific seller filter
      undefined, // No specific sale type filter
    );

    // Filter for completed transactions only
    const completedSales = salesForDay.filter(
      (sale) => sale.transaction && sale.transaction.status === 'completed',
    );

    let servicesCash = 0;
    let addOnsCash = 0;

    for (const sale of completedSales) {
      if (sale.saleType === 'SERVICE') {
        servicesCash += sale.price * sale.quantity;
      } else if (sale.saleType === 'ADDON') {
        addOnsCash += sale.price * sale.quantity;
      }
    }

    const totalCash = servicesCash + addOnsCash;

    const cashSummary: CashSummary = {
      servicesCash,
      addOnsCash,
      totalCash,
      transactionCount: transactions.length, // Keep transaction count from actual transactions
    };

    // Get user sales for the day using SalesRecordService
    const salesSummary = await this.salesRecordService.getDailySalesSummary(
      reportDate,
    );

    // Map to UserSalesReport format
    const userSales: UserSalesReport[] = salesSummary.map((summary) => {
      // Calculate 5% commission on add-on sales
      const addOnCommission = summary.addOns.total * 0.05;

      return {
        userId: summary.sellerId,
        userName: summary.sellerName,
        userRole: summary.sellerRole,
        services: summary.services,
        addOns: summary.addOns,
        addOnCommission,
      };
    });

    return {
      date,
      technicianShifts,
      cashSummary,
      userSales,
      generatedAt: new Date().toISOString(),
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
}
