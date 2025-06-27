import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/update-transaction-dto';
import { Prisma, TransactionStatus } from '@prisma/client';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // async create(createTransactionDto: CreateTransactionDto) {
  //   return this.prisma.transaction.create({
  //     data: {
  //       customer: { connect: { id: createTransactionDto.customerId } },
  //       car: { connect: { id: createTransactionDto.carId } },
  //       technician: { connect: { id: createTransactionDto.technicianId } },
  //       service: { connect: { id: createTransactionDto.serviceId } },
  //       addOns: {
  //         connect: createTransactionDto.addOnsIds?.map((id) => ({ id })) || [],
  //       },
  //     },
  //     include: {
  //       addOns: true,
  //     },
  //   });
  // }

  async create(createTransactionDto: CreateTransactionDto) {
    return this.prisma.transaction.create({
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
    });
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: transactions,
    };
  }

  async findScheduled() {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'scheduled',
      },
      include: {
        car: { include: { brand: true, model: true } },
        technicians: true,
        customer: true,
        service: true,
        addOns: true,
      },
    });

    return transactions;
  }

  async findStageOne() {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'stageOne',
      },
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        images: true,
      },
    });

    return transactions;
  }

  async findStageTwo() {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'stageTwo',
      },
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        images: true,
      },
    });

    return transactions;
  }

  async findCompleted() {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'completed',
      },
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        technicians: true,
        service: true,
        addOns: true,
        invoice: true,
        images: true,
      },
    });

    return transactions;
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
      include: { service: true, addOns: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Generate invoice if completed
    if (updateTransactionDto.status === TransactionStatus.completed) {
      const servicePrice = transaction.service.price;
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

    // Prepare data for update
    const updateData: any = {
      status: updateTransactionDto.status,
    };

    if (updateTransactionDto.technicianIds) {
      updateData.technicians = {
        set: updateTransactionDto.technicianIds.map((id) => ({ id })),
      };
    }

    // Update transaction
    await this.prisma.transaction.update({
      where: { id: updateTransactionDto.id },
      data: updateData,
    });
  }

  async uploadTransactionImages(
    transactionId: string,
    files: Express.Multer.File[],
  ) {
    // Validate transaction exists
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { images: true },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    // Validate files
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate each file
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(
          `File ${file.originalname} is not an image file. Only image files are allowed.`,
        );
      }
    }

    // Process all files
    const uploadPromises = files.map(async (file) => {
      // Generate S3 key
      const fileExtension = file.originalname.split('.').pop();
      const key = `transactions/${transactionId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;

      // Upload to Wasabi
      await this.s3Service.uploadFile(file, key);
      const url = await this.s3Service.getFileUrl(key);

      return {
        key,
        url,
        isActive: true,
      };
    });

    // Wait for all uploads to complete
    const imageData = await Promise.all(uploadPromises);

    // Create all images and connect to transaction
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
