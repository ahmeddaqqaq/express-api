import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSuperVisorDto } from './dto/create-supervisor.dto';
import { SupervisorFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { SupervisorManyResponse } from './dto/response';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupervisorService {
  constructor(private prisma: PrismaService) {}

  async create(createSupervisorDto: CreateSuperVisorDto) {
    await this.prisma.supervisor.create({
      data: createSupervisorDto,
    });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    filterDto: SupervisorFilterDto;
    paginationDto: PaginationDto;
  }): Promise<SupervisorManyResponse> {
    const where: Prisma.SupervisorWhereInput = {
      AND: [
        {
          firstName: {
            contains: filterDto.search,
            mode: 'insensitive',
          },
        },
      ],
    };

    const count = await this.prisma.supervisor.count({
      where,
    });

    const supervisors = await this.prisma.supervisor.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
    });
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data: supervisors,
    };
  }
}
