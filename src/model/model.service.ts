import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModelDto } from './dto/create-model-dto';

@Injectable()
export class ModelService {
  constructor(private prisma: PrismaService) {}

  async create(createModelDto: CreateModelDto) {
    if (createModelDto.name) {
      const existingModel = await this.prisma.model.findFirst({
        where: { name: createModelDto.name },
      });

      if (existingModel) {
        throw new ConflictException(`Model with this name already exists`);
      }
    }

    await this.prisma.model.create({
      data: createModelDto,
    });
  }

  async findMany() {
    const models = await this.prisma.model.findMany();
    return models;
  }
}
