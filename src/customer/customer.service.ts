import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/customer-create.dto';
import { FindOneCustomerDto } from './dto/find-one-dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CustomerFilterDto } from './dto/filter-dto';
import { Prisma } from '@prisma/client';
import { CustomersManyResponse } from './responses';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create({
    createCustomerDto,
  }: {
    createCustomerDto: CreateCustomerDto;
  }) {
    if (createCustomerDto.mobileNumber) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { mobileNumber: createCustomerDto.mobileNumber },
      });

      if (existingCustomer) {
        throw new ConflictException(
          `Customer with this mobile number already exists`,
        );
      }
    }

    await this.prisma.customer.create({
      data: {
        fName: createCustomerDto.fName,
        lName: createCustomerDto.lName,
        mobileNumber: createCustomerDto.mobileNumber,
      },
    });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    paginationDto: PaginationDto;
    filterDto: CustomerFilterDto;
  }): Promise<CustomersManyResponse> {
    const where: Prisma.CustomerWhereInput = {
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
        {
          OR: [
            {
              fName: {
                contains: filterDto.search,
                mode: 'insensitive',
              },
            },
            {
              lName: {
                contains: filterDto.search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    if (filterDto.search) {
      const searchTerm = filterDto.search.toLowerCase();
      const fullNameCondition = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Customer" 
        WHERE LOWER(CONCAT("fName", ' ', "lName")) LIKE ${`%${searchTerm}%`}
      `;
      
      if (fullNameCondition.length > 0) {
        const matchingIds = fullNameCondition.map((row) => row.id);
        where.OR.push({
          id: {
            in: matchingIds,
          },
        });
      }
    }

    const total = await this.prisma.customer.count({ where });

    const customers = await this.prisma.customer.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      include: { cars: { include: { brand: true, model: true } } },
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      rows: total,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: customers,
    };
  }

  async findOne({
    findOneCustomerDto,
  }: {
    findOneCustomerDto: FindOneCustomerDto;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: findOneCustomerDto.id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: updateCustomerDto.id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.update({
      where: { id: updateCustomerDto.id },
      data: {
        count: updateCustomerDto.count,
        mobileNumber: updateCustomerDto.mobileNumber,
        fName: updateCustomerDto.fName,
        lName: updateCustomerDto.lName,
        isActive: updateCustomerDto.isActive,
        isBlacklisted: updateCustomerDto.isBlacklisted,
      },
    });
  }

  async toggleBlacklist(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
        isBlacklisted: !customer.isBlacklisted,
      },
      include: { cars: { include: { brand: true, model: true } } },
    });

    return updatedCustomer;
  }

  async delete(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.prisma.customer.delete({
      where: { id },
    });
  }
}
