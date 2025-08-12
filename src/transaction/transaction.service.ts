import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateUtils } from '../utils/date-utils';
import { CreateTransactionDto } from './dto/transaction-dto';
import {
  UpdateTransactionDto,
  EditScheduledTransactionDto,
} from './dto/update-transaction-dto';
import { Prisma, TransactionStatus } from '@prisma/client';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { S3Service } from 'src/s3/s3.service';
import axios from 'axios';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { IntegrationService } from 'src/integration/integration.service';
import { AssignSalesToAddonsDto } from './dto/assign-sales-to-addons.dto';

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
    return DateUtils.getStartOfDayUTC3(date);
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
    return DateUtils.getEndOfDayUTC3(date);
  }

  async create(createTransactionDto: CreateTransactionDto, userId?: string) {
    console.log('TransactionService.create - userId:', userId);
    const transaction = await this.prisma.transaction.create({
      data: {
        customer: { connect: { id: createTransactionDto.customerId } },
        car: { connect: { id: createTransactionDto.carId } },
        service: { connect: { id: createTransactionDto.serviceId } },
        createdBy: userId ? { connect: { id: userId } } : undefined,
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
        createdBy: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
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
    const where: Prisma.TransactionWhereInput = {};

    // Search filtering
    if (filterDto.search) {
      where.OR = [
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
      ];
    }

    // Date filtering
    if (filterDto.date) {
      const startOfDay = this.getStartOfDayUTC3(new Date(filterDto.date));
      const endOfDay = this.getEndOfDayUTC3(new Date(filterDto.date));

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const count = await this.prisma.transaction.count({ where });

    const transactions = await this.prisma.transaction.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
      include: {
        customer: true,
        createdBy: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        service: true,
        addOns: true,
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        customer: true,
        createdBy: true,
        service: true,
        addOns: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        service: true,
        addOns: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        service: true,
        addOns: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        service: true,
        addOns: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        service: true,
        addOns: true,
        invoice: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findCancelled(date?: Date) {
    const where: Prisma.TransactionWhereInput = {
      status: 'cancelled',
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        service: true,
        addOns: true,
        createdBy: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async cancelTransaction(id: string, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        customer: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    if (transaction.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot cancel transaction. Transaction is currently in ${transaction.status} status. Only scheduled transactions can be cancelled.`,
      );
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: notes || transaction.notes,
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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        createdBy: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return updatedTransaction;
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
        assignments: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    // Store original status for phase transition logging
    const originalStatus = transaction.status;

    // Validate phase progression if status is changing
    if (
      updateTransactionDto.status &&
      updateTransactionDto.status !== originalStatus
    ) {
      const validation = await this.validatePhaseProgression(
        updateTransactionDto.id,
        updateTransactionDto.status,
      );
      if (!validation.isValid) {
        throw new BadRequestException(validation.message);
      }
    }

    // 💡 Get the carType from car.model
    const carType = transaction.car.model?.type;

    // Prepare update data
    const updateData: any = {
      status: updateTransactionDto.status,
    };

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
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        createdBy: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
      const technicianId = updateTransactionDto.updatedByTechnicianId;

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

  async editScheduledTransaction(editDto: EditScheduledTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: editDto.id },
      include: {
        service: true,
        addOns: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    if (transaction.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot edit transaction. Transaction is currently in ${transaction.status} status. Only scheduled transactions can be edited.`,
      );
    }

    // Validate service exists if provided
    if (editDto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: editDto.serviceId },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    // Validate addons exist if provided
    if (editDto.addOnsIds && editDto.addOnsIds.length > 0) {
      const addOns = await this.prisma.addOn.findMany({
        where: {
          id: { in: editDto.addOnsIds },
        },
      });
      if (addOns.length !== editDto.addOnsIds.length) {
        throw new BadRequestException('One or more selected add-ons were not found. Please verify your selection and try again.');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (editDto.serviceId) {
      updateData.service = { connect: { id: editDto.serviceId } };
    }

    if (editDto.addOnsIds !== undefined) {
      if (editDto.addOnsIds.length === 0) {
        // If empty array, disconnect all addons
        updateData.addOns = {
          set: [],
        };
      } else {
        updateData.addOns = {
          set: editDto.addOnsIds.map((id: string) => ({ id })),
        };
      }
    }

    if (editDto.deliverTime !== undefined) {
      updateData.deliverTime = editDto.deliverTime;
    }

    if (editDto.notes !== undefined) {
      updateData.notes = editDto.notes;
    }

    return await this.prisma.transaction.update({
      where: { id: editDto.id },
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
        createdBy: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
      },
    });
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
    userId?: string,
  ) {
    console.log('uploadTransactionImages called with userId:', userId);
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No image files were uploaded. Please select at least one image to upload.');
    }

    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `File ${file.originalname} is not a valid image format. Please upload only JPG, PNG, or WebP image files.`,
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
        uploadedById: userId || null,
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
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
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
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
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
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
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

  async assignTechnicianToPhase(
    transactionId: string,
    technicianIds: string[],
    phase: 'stageOne' | 'stageTwo' | 'stageThree',
  ) {
    if (!['stageOne', 'stageTwo', 'stageThree'].includes(phase)) {
      throw new BadRequestException(
        `Invalid phase '${phase}'. Technicians can only be assigned to Phase 1 (stageOne), Phase 2 (stageTwo), or Phase 3 (stageThree).`,
      );
    }

    if (!technicianIds || technicianIds.length === 0) {
      throw new BadRequestException(
        'No technician selected. Please select at least one technician to assign to this phase.',
      );
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        assignments: true,
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    const technicians = await this.prisma.technician.findMany({
      where: { id: { in: technicianIds } },
    });

    if (technicians.length !== technicianIds.length) {
      throw new NotFoundException('One or more technicians not found');
    }

    const existingAssignments = await this.prisma.technicianAssignment.findMany(
      {
        where: {
          transactionId,
          phase: phase as any,
          technicianId: { in: technicianIds },
        },
      },
    );

    if (existingAssignments.length > 0) {
      const existingTechnicianIds = existingAssignments.map(
        (a) => a.technicianId,
      );
      throw new BadRequestException(
        `The following technicians are already assigned to ${phase === 'stageOne' ? 'Phase 1' : phase === 'stageTwo' ? 'Phase 2' : 'Phase 3'}: ${existingTechnicianIds.join(
          ', ',
        )}. Please select different technicians.`,
      );
    }

    const assignmentData = technicianIds.map((technicianId) => ({
      technicianId,
      transactionId,
      phase: phase as any,
    }));

    await this.prisma.technicianAssignment.createMany({
      data: assignmentData,
    });

    return await this.prisma.technicianAssignment.findMany({
      where: {
        transactionId,
        phase: phase as any,
        technicianId: { in: technicianIds },
      },
      include: {
        technician: true,
        transaction: true,
      },
    });
  }

  async validatePhaseProgression(
    transactionId: string,
    targetPhase: string,
  ): Promise<{ isValid: boolean; message: string }> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        assignments: {
          include: {
            technician: true,
          },
        },
        salesAssignments: {
          include: {
            sales: true,
          },
        },
        images: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    const currentPhase = transaction.status;

    if (targetPhase === 'stageOne' && currentPhase === 'scheduled') {
      return { isValid: true, message: 'Can move from scheduled to stageOne' };
    }

    if (targetPhase === 'stageTwo' && currentPhase === 'stageOne') {
      const stageOneAssignment = transaction.assignments.find(
        (a) => a.phase === 'stageOne' && a.isActive,
      );
      const stageOneImages = transaction.images.filter(
        (img) => img.uploadedAtStage === 'stageOne',
      );

      if (!stageOneAssignment) {
        return {
          isValid: false,
          message:
            'Cannot move to Phase 2. Please assign a technician to Phase 1 first.',
        };
      }

      if (stageOneImages.length === 0) {
        return {
          isValid: false,
          message: 'Cannot move to Phase 2. Please upload at least one image for Phase 1 completion.',
        };
      }

      return { isValid: true, message: 'Can move from stageOne to stageTwo' };
    }

    if (targetPhase === 'stageThree' && currentPhase === 'stageTwo') {
      const stageTwoAssignment = transaction.assignments.find(
        (a) => a.phase === 'stageTwo' && a.isActive,
      );
      const stageTwoImages = transaction.images.filter(
        (img) => img.uploadedAtStage === 'stageTwo',
      );

      if (!stageTwoAssignment) {
        return {
          isValid: false,
          message:
            'Cannot move to Phase 3. Please assign a technician to Phase 2 first.',
        };
      }

      if (stageTwoImages.length === 0) {
        return {
          isValid: false,
          message: 'Cannot move to Phase 3. Please upload at least one image for Phase 2 completion.',
        };
      }

      return { isValid: true, message: 'Can move from stageTwo to stageThree' };
    }

    if (targetPhase === 'completed' && currentPhase === 'stageThree') {
      const stageThreeAssignment = transaction.assignments.find(
        (a) => a.phase === 'stageThree' && a.isActive,
      );
      const stageThreeImages = transaction.images.filter(
        (img) => img.uploadedAtStage === 'stageThree',
      );

      if (!stageThreeAssignment) {
        return {
          isValid: false,
          message: 'Cannot complete transaction. Please assign a technician to Phase 3 first.',
        };
      }

      if (stageThreeImages.length === 0) {
        return {
          isValid: false,
          message: 'Cannot complete transaction. Please upload at least one image for Phase 3 completion.',
        };
      }

      return {
        isValid: true,
        message: 'Can move from stageThree to completed',
      };
    }

    return {
      isValid: false,
      message: `Invalid status change. Cannot move directly from ${currentPhase === 'scheduled' ? 'Scheduled' : currentPhase === 'stageOne' ? 'Phase 1' : currentPhase === 'stageTwo' ? 'Phase 2' : currentPhase === 'stageThree' ? 'Phase 3' : currentPhase} to ${targetPhase === 'stageOne' ? 'Phase 1' : targetPhase === 'stageTwo' ? 'Phase 2' : targetPhase === 'stageThree' ? 'Phase 3' : targetPhase === 'completed' ? 'Completed' : targetPhase}. Please follow the correct workflow sequence.`,
    };
  }

  async getTransactionAssignments(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        assignments: {
          include: {
            technician: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    return transaction.assignments;
  }

  async getPhaseAssignments(
    transactionId: string,
    phase: 'stageOne' | 'stageTwo' | 'stageThree',
  ) {
    return await this.prisma.technicianAssignment.findMany({
      where: {
        transactionId,
        phase: phase as any,
        isActive: true,
      },
      include: {
        technician: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async assignSalesToAddons(assignSalesDto: AssignSalesToAddonsDto) {
    const { transactionId, salesId, addOnNames } = assignSalesDto;

    // Verify transaction exists and is in scheduled status
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    if (transaction.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot assign sales person to addons. Transaction is currently in ${transaction.status} status. Sales assignments can only be made for scheduled transactions.`,
      );
    }

    // Verify sales person exists
    const sales = await this.prisma.sales.findUnique({
      where: { id: salesId },
    });

    if (!sales) {
      throw new NotFoundException('Sales person not found. Please verify the sales person ID and try again.');
    }

    // Check if there's already an assignment for this transaction and sales person
    const existingAssignment = await this.prisma.transactionAddonSales.findUnique({
      where: {
        transactionId_salesId: {
          transactionId,
          salesId,
        },
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      return this.prisma.transactionAddonSales.update({
        where: { id: existingAssignment.id },
        data: {
          addOnNames,
        },
        include: {
          sales: true,
          transaction: {
            include: {
              addOns: true,
            },
          },
        },
      });
    } else {
      // Create new assignment
      return this.prisma.transactionAddonSales.create({
        data: {
          transactionId,
          salesId,
          addOnNames,
        },
        include: {
          sales: true,
          transaction: {
            include: {
              addOns: true,
            },
          },
        },
      });
    }
  }

  async getSalesAssignments(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found. Please verify the transaction ID and try again.');
    }

    return this.prisma.transactionAddonSales.findMany({
      where: { transactionId },
      include: {
        sales: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }
}
