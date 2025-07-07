import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatsFilterDto, TimeRange } from './models/stats-filter.dto';
import {
  AddOnRevenue,
  RevenueSummary,
  ServiceRevenue,
} from './models/revenue.response';
import { TopCustomer } from './models/top-customer-response';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(filter: StatsFilterDto): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (filter.customStart && filter.customEnd) {
      return { start: filter.customStart, end: filter.customEnd };
    }

    switch (filter.range) {
      case TimeRange.DAY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
}
