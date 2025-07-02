// service.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service-dto';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const { name, prices } = createServiceDto;

    const service = await this.prisma.service.create({
      data: {
        name,
        prices: {
          create: prices.map(({ carType, price }) => ({
            carType,
            price,
          })),
        },
      },
      include: {
        prices: true,
      },
    });

    return service;
  }

  async findMany() {
    const services = await this.prisma.service.findMany({
      include: {
        prices: true,
      },
    });

    return services;
  }

  async update(id: string, updateServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new Error('Service not found.');
    
    const { name, prices } = updateServiceDto;
    
    return this.prisma.service.update({
      where: { id },
      data: {
        name,
        prices: {
          deleteMany: {},
          create: prices.map(({ carType, price }) => ({
            carType,
            price,
          })),
        },
      },
      include: {
        prices: true,
      },
    });
  }

  async delete(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new Error('Service not found.');
    
    return this.prisma.service.delete({ where: { id } });
  }
}
