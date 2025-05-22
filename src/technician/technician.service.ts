import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTechnicianDto } from './dto/create-technician-dto';
import { TechnicianFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TechnicianService {
  constructor(private prisma: PrismaService) {}

  async create(createTechnicianDto: CreateTechnicianDto) {
    await this.prisma.technician.create({ data: createTechnicianDto });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    filterDto: TechnicianFilterDto;
    paginationDto: PaginationDto;
  }) {
    const where: Prisma.TechnicianWhereInput = {
      AND: [
        {
          mobileNumber: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
      ],
    };

    const count = await this.prisma.technician.count({
      where,
    });

    const technicians = await this.prisma.technician.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
    });
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: technicians,
    };
  }
}
