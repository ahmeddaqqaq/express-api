import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
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

  async update(id: string, updateModelDto: CreateModelDto) {
    if (updateModelDto.name) {
      const existingModel = await this.prisma.model.findFirst({
        where: { 
          name: updateModelDto.name,
          brandId: updateModelDto.brandId
        },
      });

      if (existingModel && existingModel.id !== id) {
        throw new ConflictException(`Model with this name already exists for this brand`);
      }
    }

    await this.prisma.model.update({
      where: { id },
      data: updateModelDto,
    });
  }

  async delete(id: string) {
    const carsUsingModel = await this.prisma.car.count({
      where: { modelId: id },
    });

    if (carsUsingModel > 0) {
      throw new BadRequestException(
        `Cannot delete model. It is currently used by ${carsUsingModel} car(s).`
      );
    }

    await this.prisma.model.delete({
      where: { id },
    });
  }
}
