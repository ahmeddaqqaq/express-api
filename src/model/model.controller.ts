import { Body, Controller, Get, Post } from '@nestjs/common';
import { ModelService } from './model.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateModelDto } from './dto/create-model-dto';
import { ModelResponse } from './dto/response';

@ApiTags('Model')
@Controller('model')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

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
  async create(@Body() createModelDto: CreateModelDto) {
    return await this.modelService.create(createModelDto);
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
    type: [ModelResponse],
  })
  @Get('findMany')
  async findMany() {
    return await this.modelService.findMany();
  }
}
