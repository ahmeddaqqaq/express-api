import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStatistics() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const [
      activeCustomers,
      completedTransactions,
      newCustomersToday,
      completedTransactionsToday,
      scheduledTransactions,
      inProgressTransaction,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: { isActive: true },
      }),
      this.prisma.transaction.count({
        where: { status: 'completed' },
      }),
      this.prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'completed',
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          status: 'scheduled',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.transaction.count({
        where: {
          AND: [{ status: 'stageOne' }, { status: 'stageTwo' }],
        },
      }),
    ]);

    return {
      activeCustomers,
      completedTransactions,
      newCustomersToday,
      completedTransactionsToday,
      scheduledTransactions,
      inProgressTransaction,
    };
  }

  async serviceCompletion() {
    const completedTrx = await this.prisma.transaction.count({
      where: { status: 'completed' },
    });

    const cancelledTrx = await this.prisma.transaction.count({
      where: { status: 'cancelled' },
    });

    const ratio = ((completedTrx - cancelledTrx) / completedTrx) * 100;

    return { completionRatio: ratio };
  }
}
