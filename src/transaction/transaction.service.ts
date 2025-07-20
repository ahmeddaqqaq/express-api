import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/update-transaction-dto';
import { Prisma, TransactionStatus } from '@prisma/client';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { S3Service } from 'src/s3/s3.service';
import axios from 'axios';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { IntegrationService } from 'src/integration/integration.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly auditLogService: AuditLogService,
    private readonly integrationService: IntegrationService,
  ) {}

  logger = new Logger('TransactionService');

  // Helper functions for UTC+3 timezone handling
  private getStartOfDayUTC3(date: Date): Date {
    // Create start of day in UTC+3 timezone
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    // Subtract 3 hours to convert UTC+3 to UTC
    startOfDay.setTime(startOfDay.getTime() - 3 * 60 * 60 * 1000);
    return startOfDay;
  }

  private generateRandomHex(): string {
    return Math.floor(Math.random() * 0x10000)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
  }

  private async sendSMS(mobileNumber: string, message: string): Promise<void> {
    try {
      const otpUrl = `${process.env.OTP_SERVICE_URL}&msg=${encodeURIComponent(
        message,
      )}&numbers=${'962' + mobileNumber.slice(1)}`;

      await axios.get(otpUrl, {
        timeout: 10000,
      });

      this.logger.log(`SMS sent successfully to ${mobileNumber}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send SMS to ${mobileNumber}: ${error.message}`,
      );
    }
  }

  private getEndOfDayUTC3(date: Date): Date {
    // Create end of day in UTC+3 timezone
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    // Subtract 3 hours to convert UTC+3 to UTC
    endOfDay.setTime(endOfDay.getTime() - 3 * 60 * 60 * 1000);
    return endOfDay;
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: {
        customer: { connect: { id: createTransactionDto.customerId } },
        car: { connect: { id: createTransactionDto.carId } },
        service: { connect: { id: createTransactionDto.serviceId } },
        // technicians: {
        //   connect:
        //     createTransactionDto.technicianIds.map((id) => ({ id })) || [],
        // },
        supervisor: { connect: { id: createTransactionDto.supervisorId } },
        addOns: {
          connect: createTransactionDto.addOnsIds?.map((id) => ({ id })) || [],
        },
        notes: createTransactionDto.note,
        deliverTime: createTransactionDto.deliverTime,
      },
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
        technicians: true,
        supervisor: true,
        images: true,
      },
    });
    const customer = await this.prisma.customer.findUnique({
      where: { id: createTransactionDto.customerId },
    });
    if (
      customer.mobileNumber.startsWith('079') ||
      customer.mobileNumber.startsWith('077') ||
      customer.mobileNumber.startsWith('078')
    ) {
      const welcomeMessage =
        'Thank you for choosing RADIANT! Your car will shine in no time, we will notify you once car is ready for collection.';
      await this.sendSMS(customer.mobileNumber, welcomeMessage);
    }

    // Create POS integration order after transaction creation
    try {
      const posOrder = await this.integrationService.createOrderFromTransaction(
        transaction.id,
      );
      const orderData = posOrder.data as any;
      this.logger.log(
        `POS order created for transaction ${transaction.id} with order number: ${orderData.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create POS order for transaction ${transaction.id}:`,
        error.message,
      );
    }

    return transaction;
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    filterDto: TransactionFilterDto;
    paginationDto: PaginationDto;
  }) {
    //search by full name
    const where: Prisma.TransactionWhereInput = {
      OR: [
        {
          customer: {
            OR: [
              {
                mobileNumber: {
                  contains: filterDto.search,
                  mode: 'insensitive',
                },
              },
              {
                cars: {
                  some: {
                    plateNumber: {
                      contains: filterDto.search,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          },
        },
        {
          id: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
      ],
    };

    const count = await this.prisma.transaction.count({ where });

    const transactions = await this.prisma.transaction.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
      include: {
        customer: true,
        supervisor: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        images: true,
        service: true,
        addOns: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: transactions,
    };
  }

  async findScheduled(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'scheduled',
    };

    if (date) {
      // Convert to UTC+3 timezone aware boundaries
      const startOfDay = this.getStartOfDayUTC3(date);
      const endOfDay = this.getEndOfDayUTC3(date);
      this.logger.verbose(
        `Using UTC+3 boundaries: ${startOfDay} - ${endOfDay}`,
      );
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        technicians: true,
        customer: true,
        service: true,
        addOns: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findStageOne(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'stageOne',
    };

    if (date) {
      // Convert to UTC+3 timezone aware boundaries
      const startOfDay = this.getStartOfDayUTC3(date);
      const endOfDay = this.getEndOfDayUTC3(date);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        images: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findStageTwo(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'stageTwo',
    };

    if (date) {
      // Convert to UTC+3 timezone aware boundaries
      const startOfDay = this.getStartOfDayUTC3(date);
      const endOfDay = this.getEndOfDayUTC3(date);

      where.OR = [
        {
          // Check if updatedAt falls within the date range
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          // Or check if createdAt falls within the date range
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        images: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findStageThree(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'stageThree',
    };

    if (date) {
      // Convert to UTC+3 timezone aware boundaries
      const startOfDay = this.getStartOfDayUTC3(date);
      const endOfDay = this.getEndOfDayUTC3(date);

      where.OR = [
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
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        images: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findCompleted(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'completed',
    };

    if (date) {
      // Convert to UTC+3 timezone aware boundaries
      const startOfDay = this.getStartOfDayUTC3(date);
      const endOfDay = this.getEndOfDayUTC3(date);

      where.OR = [
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
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        invoice: true,
        images: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findCancelled() {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'cancelled',
      },
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        service: true,
        addOns: true,
      },
    });

    return transactions;
  }

  async update(updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: updateTransactionDto.id },
      include: {
        service: true,
        addOns: true,
        car: {
          include: {
            model: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Store original status for phase transition logging
    const originalStatus = transaction.status;

    // 💡 Get the carType from car.model
    const carType = transaction.car.model?.type;

    // Prepare update data
    const updateData: any = {
      status: updateTransactionDto.status,
    };

    if (updateTransactionDto.technicianIds) {
      updateData.technicians = {
        set: updateTransactionDto.technicianIds.map((id) => ({ id })),
      };

      // Always log technician assignments when technicians are assigned
      // Use the new status if provided, otherwise use the current status
      const assignmentPhase = updateTransactionDto.status || originalStatus;
      for (const technicianId of updateTransactionDto.technicianIds) {
        await this.auditLogService.assignTechnicianToPhase(
          technicianId,
          updateTransactionDto.id,
          assignmentPhase,
        );
      }
    }

    const OTPCode = this.generateRandomHex();

    // Add OTP to update data
    updateData.OTP = OTPCode;

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: updateTransactionDto.id },
      data: updateData,
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
        technicians: true,
        supervisor: true,
        images: true,
        invoice: true,
      },
    });
    let servicePrice = 0;
    if (
      updateTransactionDto.status === TransactionStatus.completed &&
      carType
    ) {
      const priceByType = await this.prisma.servicePrice.findFirst({
        where: {
          serviceId: transaction.service.id,
          carType: carType,
        },
      });

      if (!priceByType) {
        throw new NotFoundException(
          `No price found for service ${transaction.service.name} and car type ${carType}`,
        );
      }

      servicePrice = priceByType.price;

      const addOnsPrice = transaction.addOns.reduce(
        (sum, addOn) => sum + addOn.price,
        0,
      );

      const totalAmount = servicePrice + addOnsPrice;

      await this.prisma.invoice.create({
        data: {
          transactionId: transaction.id,
          totalAmount,
        },
      });
    }

    // Log phase transition if status changed
    if (
      updateTransactionDto.status &&
      updateTransactionDto.status !== originalStatus
    ) {
      const technicianId =
        updateTransactionDto.updatedByTechnicianId ||
        updateTransactionDto.technicianIds?.[0];

      if (technicianId) {
        await this.auditLogService.logPhaseTransition(
          technicianId,
          updateTransactionDto.id,
          originalStatus,
          updateTransactionDto.status,
        );
      }
    }

    if (updateTransactionDto.status === TransactionStatus.completed) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: transaction.customerId },
      });
      if (
        customer.mobileNumber.startsWith('079') ||
        customer.mobileNumber.startsWith('077') ||
        customer.mobileNumber.startsWith('078')
      ) {
        const brand = await this.prisma.brand.findUnique({
          where: { id: transaction.car.brandId },
        });
        const completionMessage = `Dear ${customer.fName}, Your ${brand.name} ${transaction.car.model.name} is ready and radiant. Please collect your car from our front desk. We hope to see you again soon! Your OTP number is ${OTPCode}`;
        await this.sendSMS(customer.mobileNumber, completionMessage);
      }
    }

    return updatedTransaction;
  }

  async calculateTotal(calculateTotalDto: CalculateTotalDto) {
    const car = await this.prisma.car.findUnique({
      where: {
        id: calculateTotalDto.carId,
      },
      include: {
        model: true,
      },
    });

    const priceByType = await this.prisma.servicePrice.findFirst({
      where: {
        serviceId: calculateTotalDto.serviceId,
        carType: car.model.type,
      },
    });

    let total = priceByType.price;

    if (
      calculateTotalDto?.addOnsIds &&
      calculateTotalDto?.addOnsIds.length > 0
    ) {
      const addOnsRecords = await this.prisma.addOn.findMany({
        where: {
          id: {
            in: calculateTotalDto.addOnsIds,
          },
        },
      });

      const addOnsTotal = addOnsRecords.reduce(
        (sum, addOn) => sum + addOn.price,
        0,
      );
      total += addOnsTotal;
    }

    return {
      total,
    };
  }

  async uploadTransactionImages(
    transactionId: string,
    files: Express.Multer.File[],
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { images: true },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `File ${file.originalname} is not an image file. Only image files are allowed.`,
        );
      }
    }

    const uploadPromises = files.map(async (file) => {
      const fileExtension = file.originalname.split('.').pop();
      const key = `transactions/${transactionId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;

      await this.s3Service.uploadFile(file, key);

      // Use API URL instead of signed URL to avoid expiration
      const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
      const url = `${baseUrl}/express/images/serve/${key}`;

      return {
        key,
        url,
        isActive: true,
        uploadedAtStage: transaction.status,
      };
    });

    const imageData = await Promise.all(uploadPromises);

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        images: {
          create: imageData,
        },
      },
      include: {
        images: true,
      },
    });
  }

  async getTransactionImagesByStage(
    transactionId: string,
    stage?: TransactionStatus,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        images: {
          where: stage ? { uploadedAtStage: stage } : {},
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    return transaction.images;
  }

  async getAllImagesGroupedByStage(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        images: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Group images by stage
    const imagesByStage = transaction.images.reduce(
      (acc, image) => {
        const stage = image.uploadedAtStage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = [];
        }
        acc[stage].push(image);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return imagesByStage;
  }
}
