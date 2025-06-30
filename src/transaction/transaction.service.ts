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

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  logger = new Logger('s3');

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
        addOns: true,
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
      const otpUrl = `${
        process.env.OTP_SERVICE_URL
      }&msg=Thank%20you%20for%20choosing%20RADIANT!%20Your%20car%20will%20shine%20in%20no%20time,%20we%20will%20notify%20you%20once%20car%20is%20ready%20for%20collection.&numbers=${
        '962' + customer.mobileNumber.toString().slice(1)
      }`;
      await axios.get(otpUrl);
    }
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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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

    // 💡 Get the carType from car.model
    const carType = transaction.car.model?.type;

    // 🔍 Fetch the correct price for the service & car type
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

    // Prepare update data
    const updateData: any = {
      status: updateTransactionDto.status,
    };

    if (updateTransactionDto.technicianIds) {
      updateData.technicians = {
        set: updateTransactionDto.technicianIds.map((id) => ({ id })),
      };
    }

    await this.prisma.transaction.update({
      where: { id: updateTransactionDto.id },
      data: updateData,
    });

    if (updateTransactionDto.status === TransactionStatus.completed) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: transaction.customerId },
      });
      if (
        customer.mobileNumber.startsWith('079') ||
        customer.mobileNumber.startsWith('077') ||
        customer.mobileNumber.startsWith('078')
      ) {
        const otpUrl = `${
          process.env.OTP_SERVICE_URL
        }&msg=Your%20car%20is%20ready%20and%20radiant.%20Please%20collect%20your%20car%20from%20our%20front%20desk.%20We%20hope%20to%20see%20you%20again%20soon!&numbers=${
          '962' + customer.mobileNumber.toString().slice(1)
        }`;
        await axios.get(otpUrl);
      }
    }
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

    const service = await this.prisma.service.findUnique({
      where: {
        id: calculateTotalDto.serviceId,
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
    this.logger.verbose('uploading image');
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
      const url = await this.s3Service.getFileUrl(key);

      return {
        key,
        url,
        isActive: true,
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
}
