import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/update-transaction-dto';
import { Prisma, TransactionStatus } from '@prisma/client';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

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
        technicians: {
          connect: createTransactionDto.technicianIds.map((id) => ({ id })),
        },
        addOns: {
          connect: createTransactionDto.addOnsIds?.map((id) => ({ id })) || [],
        },
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

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.update({
      where: { id: updateTransactionDto.id },
      data: { status: updateTransactionDto.status },
    });
  }

  async uploadTransactionImage(
    transactionId: string,
    file: Express.Multer.File,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    const imageRecord = await this.prisma.image.create({
      data: {
        key: file.filename,
        url: `http://localhost:3000/uploads/${file.filename}`,
      },
    });

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        images: {
          connect: [{ id: imageRecord.id }],
        },
      },
    });

    return imageRecord;
  }
}
