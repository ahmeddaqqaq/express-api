import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddOnDto } from './dto/create-add-on-dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@Injectable()
export class AddOnsService {
  constructor(private prisma: PrismaService) {}

  async create(createAddOnDto: CreateAddOnDto) {
    await this.prisma.addOn.create({
      data: createAddOnDto,
    });
  }

  async findAll({ paginationDto }: { paginationDto: PaginationDto }) {
    const count = await this.prisma.addOn.count();
    const addOns = await this.prisma.addOn.findMany();
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: addOns,
    };
  }

  async findOne(id: string) {
    const addOn = await this.prisma.addOn.findUnique({ where: { id } });
    return addOn;
  }
}
