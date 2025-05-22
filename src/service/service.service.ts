import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service-dto';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    await this.prisma.service.create({ data: createServiceDto });
  }

  async findMany() {
    const services = await this.prisma.service.findMany();
    return services;
  }
}
