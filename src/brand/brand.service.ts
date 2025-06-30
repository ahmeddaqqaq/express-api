import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand-dto';
import { BrandFilterDto } from './dto/filter-dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandDto: CreateBrandDto) {
    if (createBrandDto.name) {
      const existingBrand = await this.prisma.brand.findUnique({
        where: { name: createBrandDto.name },
      });

      if (existingBrand) {
        throw new ConflictException(`Brand already exists`);
      }
    }

    await this.prisma.brand.create({
      data: createBrandDto,
    });
  }

  async findMany({
    filterDto,
    paginationDto,
  }: {
    paginationDto: PaginationDto;
    filterDto: BrandFilterDto;
  }) {
    const where: Prisma.BrandWhereInput = {
      AND: [
        {
          name: { contains: filterDto.search, mode: 'insensitive' },
        },
      ],
    };

    const count = await this.prisma.brand.count({
      where,
    });

    const brands = await this.prisma.brand.findMany({
      skip: paginationDto.skip,
      take: paginationDto.take,
      where,
      include: { models: true },
      orderBy: {
        name: 'asc',
      },
    });

    const data = brands.map((brand) => ({
      ...brand,
      models: brand.models.map((model) => ({
        ...model,
        carType: model.type,
      })),
    }));
    return {
      rows: count,
      skip: paginationDto.skip,
      take: paginationDto.take,
      data,
    };
  }
}
