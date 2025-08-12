import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalesDto } from './dto/create-sales.dto';
import { UpdateSalesDto } from './dto/update-sales.dto';
import { SalesFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSalesDto: CreateSalesDto) {
    // Check if mobile number already exists
    if (createSalesDto.mobileNumber) {
      const existingSales = await this.prisma.sales.findUnique({
        where: { mobileNumber: createSalesDto.mobileNumber },
      });

      if (existingSales) {
        throw new ConflictException(
          `A sales person with mobile number ${createSalesDto.mobileNumber} already exists.`,
        );
      }
    }

    return this.prisma.sales.create({
      data: {
        firstName: createSalesDto.firstName,
        lastName: createSalesDto.lastName,
        mobileNumber: createSalesDto.mobileNumber,
        isActive: createSalesDto.isActive ?? true,
      },
    });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    filterDto: SalesFilterDto;
    paginationDto: PaginationDto;
  }) {
    const where: Prisma.SalesWhereInput = {};

    // Search filter
    if (filterDto.search) {
      where.OR = [
        {
          firstName: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
        {
          mobileNumber: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Active filter
    if (filterDto.isActive !== undefined) {
      where.isActive = filterDto.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.sales.findMany({
        where,
        skip: paginationDto.skip,
        take: paginationDto.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sales.count({ where }),
    ]);

    return {
      rows: total,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data,
    };
  }

  async findOne(id: string) {
    const sales = await this.prisma.sales.findUnique({
      where: { id },
      include: {
        addonsAssignments: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!sales) {
      throw new NotFoundException('Sales person not found. Please verify the ID and try again.');
    }

    return sales;
  }

  async update(updateSalesDto: UpdateSalesDto) {
    const sales = await this.prisma.sales.findUnique({
      where: { id: updateSalesDto.id },
    });

    if (!sales) {
      throw new NotFoundException('Sales person not found. Please verify the ID and try again.');
    }

    // Check if mobile number already exists for another sales person
    if (updateSalesDto.mobileNumber && updateSalesDto.mobileNumber !== sales.mobileNumber) {
      const existingSales = await this.prisma.sales.findUnique({
        where: { mobileNumber: updateSalesDto.mobileNumber },
      });

      if (existingSales) {
        throw new ConflictException(
          `A sales person with mobile number ${updateSalesDto.mobileNumber} already exists.`,
        );
      }
    }

    return this.prisma.sales.update({
      where: { id: updateSalesDto.id },
      data: {
        firstName: updateSalesDto.firstName,
        lastName: updateSalesDto.lastName,
        mobileNumber: updateSalesDto.mobileNumber,
        isActive: updateSalesDto.isActive,
      },
    });
  }

  async delete(id: string) {
    const sales = await this.prisma.sales.findUnique({
      where: { id },
      include: {
        addonsAssignments: true,
      },
    });

    if (!sales) {
      throw new NotFoundException('Sales person not found. Please verify the ID and try again.');
    }

    if (sales.addonsAssignments.length > 0) {
      throw new ConflictException(
        'Cannot delete sales person with active addon assignments. Please reassign or remove assignments first.',
      );
    }

    return this.prisma.sales.delete({
      where: { id },
    });
  }
}