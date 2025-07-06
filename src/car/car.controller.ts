import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car-dto';
import { CarResponse } from './dto/response';

@ApiTags('Car')
@Controller('car')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
  })
  @Post('create')
  async create(@Body() createCarDto: CreateCarDto) {
    return await this.carService.create(createCarDto);
  }

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
    type: [CarResponse],
  })
  @Get('findMany')
  async findMany() {
    return await this.carService.findMany();
  }

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
  })
  @Patch('update/:id')
  async update(@Param('id') id: string, @Body() updateCarDto: CreateCarDto) {
    return await this.carService.update(id, updateCarDto);
  }

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
  })
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.carService.delete(id);
  }
}
