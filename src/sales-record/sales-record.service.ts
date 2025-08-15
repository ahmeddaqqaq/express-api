import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SaleType } from '@prisma/client';

@Injectable()
export class SalesRecordService {
  constructor(private prisma: PrismaService) {}

  async recordServiceSale(
    transactionId: string,
    sellerId: string,
    serviceId: string,
    serviceName: string,
    price: number,
  ) {
    return this.prisma.salesRecord.create({
      data: {
        transactionId,
        sellerId,
        saleType: SaleType.SERVICE,
        itemId: serviceId,
        itemName: serviceName,
        price,
        quantity: 1,
      },
    });
  }

  async recordAddOnSale(
    transactionId: string,
    sellerId: string,
    addOnId: string,
    addOnName: string,
    price: number,
    quantity: number = 1,
  ) {
    return this.prisma.salesRecord.create({
      data: {
        transactionId,
        sellerId,
        saleType: SaleType.ADDON,
        itemId: addOnId,
        itemName: addOnName,
        price,
        quantity,
      },
    });
  }

  async recordMultipleAddOnSales(
    transactionId: string,
    sellerId: string,
    addOns: Array<{
      id: string;
      name: string;
      price: number;
      quantity?: number;
    }>,
  ) {
    const salesRecords = addOns.map((addOn) => ({
      transactionId,
      sellerId,
      saleType: SaleType.ADDON,
      itemId: addOn.id,
      itemName: addOn.name,
      price: addOn.price,
      quantity: addOn.quantity || 1,
    }));

    return this.prisma.salesRecord.createMany({
      data: salesRecords,
    });
  }

  async recordMultipleAddOnSalesBySalesPerson(
    transactionId: string,
    salesPersonId: string,
    addOns: Array<{
      id: string;
      name: string;
      price: number;
      quantity?: number;
    }>,
  ) {
    const salesRecords = addOns.map((addOn) => ({
      transactionId,
      salesPersonId,
      saleType: SaleType.ADDON,
      itemId: addOn.id,
      itemName: addOn.name,
      price: addOn.price,
      quantity: addOn.quantity || 1,
    }));

    return this.prisma.salesRecord.createMany({
      data: salesRecords,
    });
  }

  async getSalesForPeriod(
    startDate: Date,
    endDate: Date,
    sellerId?: string,
    saleType?: SaleType,
  ) {
    const whereClause: any = {
      soldAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(saleType && { saleType }),
    };

    // Handle seller filtering for both users and sales persons
    if (sellerId) {
      whereClause.OR = [{ sellerId: sellerId }, { salesPersonId: sellerId }];
    }

    return this.prisma.salesRecord.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  async getDailySalesSummary(date: Date) {
    const { DateUtils } = await import('../utils/date-utils');
    const startOfDay = DateUtils.getStartOfDayUTC3(date);
    const endOfDay = DateUtils.getEndOfDayUTC3(date);

    const sales = await this.prisma.salesRecord.findMany({
      where: {
        soldAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        transaction: {
          status: 'completed', // Only include completed transactions
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Group by seller and sale type
    const summary = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        sellerRole: string;
        services: { count: number; total: number };
        addOns: { count: number; total: number };
      }
    >();

    for (const sale of sales) {
      // Generate key based on whether it's a user or sales person
      const key = sale.sellerId || sale.salesPersonId;
      if (!key) continue; // Skip if neither is set

      if (!summary.has(key)) {
        let sellerName = '';
        let sellerRole = '';

        if (sale.seller) {
          sellerName = sale.seller.name;
          sellerRole = sale.seller.role;
        } else if (sale.salesPerson) {
          sellerName = `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}`;
          sellerRole = 'SALES_PERSON';
        }

        summary.set(key, {
          sellerId: key,
          sellerName,
          sellerRole,
          services: { count: 0, total: 0 },
          addOns: { count: 0, total: 0 },
        });
      }

      const sellerSummary = summary.get(key)!;
      if (sale.saleType === SaleType.SERVICE) {
        sellerSummary.services.count += sale.quantity;
        sellerSummary.services.total += sale.price * sale.quantity;
      } else {
        sellerSummary.addOns.count += sale.quantity;
        sellerSummary.addOns.total += sale.price * sale.quantity;
      }
    }

    return Array.from(summary.values());
  }

  async fixZeroServicePrices() {
    try {
      // Find all service sales records with price 0
      const zeroServiceSales = await this.prisma.salesRecord.findMany({
        where: {
          saleType: 'SERVICE',
          price: 0,
        },
        include: {
          transaction: {
            include: {
              service: true,
              car: {
                include: {
                  model: true,
                },
              },
            },
          },
        },
      });

      if (zeroServiceSales.length === 0) {
        return { fixedCount: 0, totalFound: 0 };
      }

      console.log(
        `Found ${zeroServiceSales.length} service sales records with zero prices. Fixing...`,
      );

      let fixedCount = 0;
      for (const saleRecord of zeroServiceSales) {
        try {
          // Calculate correct price based on service and car type
          const priceByType = await this.prisma.servicePrice.findFirst({
            where: {
              serviceId: saleRecord.transaction.service.id,
              carType: saleRecord.transaction.car.model.type,
            },
          });

          if (priceByType && priceByType.price > 0) {
            await this.prisma.salesRecord.update({
              where: { id: saleRecord.id },
              data: { price: priceByType.price },
            });
            fixedCount++;
          }
        } catch (error) {
          console.error(
            `Failed to fix service price for record ${saleRecord.id}:`,
            error,
          );
        }
      }

      console.log(
        `Fixed ${fixedCount} out of ${zeroServiceSales.length} zero service prices.`,
      );
      return { fixedCount, totalFound: zeroServiceSales.length };
    } catch (error) {
      console.error('Error in fixZeroServicePrices:', error);
      return { fixedCount: 0, totalFound: 0 };
    }
  }

  async getDetailedSalesReport(
    startDate: Date,
    endDate: Date,
    includeIncomplete = false,
  ) {
    const whereClause: any = {
      soldAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (!includeIncomplete) {
      whereClause.transaction = {
        status: 'completed',
      };
    }

    const sales = await this.prisma.salesRecord.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        soldAt: 'desc',
      },
    });

    return sales.map((sale) => ({
      id: sale.id,
      transactionId: sale.transactionId,
      saleType: sale.saleType,
      itemId: sale.itemId,
      itemName: sale.itemName,
      price: sale.price,
      quantity: sale.quantity,
      totalAmount: sale.price * sale.quantity,
      soldAt: sale.soldAt,
      sellerType: sale.seller ? 'USER' : 'SALES_PERSON',
      sellerId: sale.sellerId || sale.salesPersonId,
      sellerName: sale.seller
        ? sale.seller.name
        : sale.salesPerson
        ? `${sale.salesPerson.firstName} ${sale.salesPerson.lastName}`
        : 'Unknown',
      sellerRole: sale.seller ? sale.seller.role : 'SALES_PERSON',
      transactionStatus: sale.transaction?.status,
    }));
  }

  async getUserSalesStats(userId: string, startDate: Date, endDate: Date) {
    const sales = await this.prisma.salesRecord.findMany({
      where: {
        OR: [{ sellerId: userId }, { salesPersonId: userId }],
        soldAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      services: { count: 0, total: 0 },
      addOns: {
        count: 0,
        total: 0,
        items: new Map<string, { count: number; total: number }>(),
      },
    };

    for (const sale of sales) {
      if (sale.saleType === SaleType.SERVICE) {
        stats.services.count += sale.quantity;
        stats.services.total += sale.price * sale.quantity;
      } else {
        stats.addOns.count += sale.quantity;
        stats.addOns.total += sale.price * sale.quantity;

        const itemKey = sale.itemName;
        if (!stats.addOns.items.has(itemKey)) {
          stats.addOns.items.set(itemKey, { count: 0, total: 0 });
        }
        const item = stats.addOns.items.get(itemKey)!;
        item.count += sale.quantity;
        item.total += sale.price * sale.quantity;
      }
    }

    return {
      ...stats,
      addOns: {
        count: stats.addOns.count,
        total: stats.addOns.total,
        items: Array.from(stats.addOns.items.entries()).map(([name, data]) => ({
          name,
          ...data,
        })),
      },
    };
  }
}
