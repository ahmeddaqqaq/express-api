import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service-dto';
import { ServiceResponse } from './dto/response';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Service')
@Controller('service')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

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
  async create(@Body() createServiceDto: CreateServiceDto) {
    return await this.serviceService.create(createServiceDto);
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
    type: [ServiceResponse],
  })
  @Get('findMany')
  async findMany() {
    return await this.serviceService.findMany();
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: CreateServiceDto,
  ) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.delete(id);
  }
}
