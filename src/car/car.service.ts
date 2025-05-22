import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCarDto } from './dto/create-car-dto';

@Injectable()
export class CarService {
  constructor(private prisma: PrismaService) {}

  async create(createCarDto: CreateCarDto) {
    await this.prisma.car.create({
      data: createCarDto,
    });
  }

  async findMany() {
    const cars = await this.prisma.car.findMany({
      include: { brand: true, model: true },
    });
    return cars;
  }
}
