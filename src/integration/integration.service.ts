import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrderFromTransaction(transactionId: string) {
    // Check if POS order already exists for this transaction
    const existingPosOrder = await this.prisma.posOrder.findUnique({
      where: { transactionId },
    });

    if (existingPosOrder) {
      return existingPosOrder;
    }

    // Get the specific transaction with all related data
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
        status: {
          notIn: ['completed', 'cancelled'],
        },
      },
      include: {
        customer: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        service: {
          include: {
            prices: true,
          },
        },
        addOns: true,
      },
    });

    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    // Get the service price for the specific car type
    const servicePrice = await this.prisma.servicePrice.findFirst({
      where: {
        serviceId: transaction.service.id,
        carType: transaction.car.model.type,
      },
    });

    if (!servicePrice) {
      throw new Error(
        `No price found for service ${transaction.service.name} and car type ${transaction.car.model.type}`,
      );
    }

    const products = [];

    // Add the service as a product using posServiceId
    products.push({
      id: transaction.service.posServiceId,
      note: null,
      count: 1,
      taxValue: 0,
      taxPercent: 8,
      discountValue: 0,
      originalPrice: servicePrice.price,
      priceAfterTax: servicePrice.price,
      selleingPrice: servicePrice.price,
    });

    // Add add-ons as products using posServiceId
    transaction.addOns.forEach((addOn) => {
      products.push({
        id: addOn.posServiceId,
        note: null,
        count: 1,
        taxValue: 0,
        taxPercent: 8,
        discountValue: 0,
        originalPrice: addOn.price,
        priceAfterTax: addOn.price,
        selleingPrice: addOn.price,
      });
    });

    // Calculate total price
    const totalPrice = products.reduce(
      (sum, product) => sum + product.selleingPrice,
      0,
    );
    const orderNumber = Math.floor(Math.random() * 1000000000);

    // Create the exact response format
    const responseData = {
      price: {
        priceMode: null,
        totalPrice: totalPrice,
        servicefee: 0.25,
        discountType: 'Discount_promo',
        orderPayment: 'Cash',
        deliveryPrice: 0,
        totalDiscount: 0,
      },
      menuId: '5',
      branchId: 1,
      isPickup: false,
      products: products,
      orderNote: transaction.notes || null,
      OrderHastag: null,
      orderNumber: orderNumber,
      orderSourceName: 'Radiant_App',
      orderCompanyPhone: '0795998808',
      orderCompanyCustomer: `${transaction.customer.fName} ${transaction.customer.lName}`,
      plateNumber: transaction.car.plateNumber,
    };

    // Save POS order to database
    const posOrder = await this.prisma.posOrder.create({
      data: {
        transactionId,
        data: responseData,
      },
    });

    return posOrder;
  }

  async getPosOrderByTransactionId(transactionId: string) {
    return this.prisma.posOrder.findUnique({
      where: { transactionId },
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
            service: true,
            addOns: true,
          },
        },
      },
    });
  }

  async getAllPosOrders() {
    return this.prisma.posOrder.findMany({
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
            service: true,
            addOns: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMany() {
    // Get all POS orders for non-completed and non-cancelled transactions
    const posOrders = await this.prisma.posOrder.findMany({
      where: {
        transaction: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return the stored data for each POS order
    return posOrders.map((order) => ({
      data: order.data,
    }));
  }

  async markTransactionAsPaid(transactionId: string) {
    // Find the transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Check if transaction is in completed status
    if (transaction.status !== 'completed') {
      throw new BadRequestException('Transaction must be in completed status to mark as paid');
    }

    // Check if already paid
    if (transaction.isPaid) {
      throw new BadRequestException('Transaction is already marked as paid');
    }

    // Update transaction to mark as paid
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { isPaid: true },
      include: {
        customer: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        service: true,
        addOns: true,
        createdBy: true,
      },
    });

    return {
      message: 'Transaction marked as paid successfully',
      transaction: updatedTransaction,
    };
  }
}
