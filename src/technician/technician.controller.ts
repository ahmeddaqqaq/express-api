import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTechnicianDto } from './dto/create-technician-dto';
import { TechnicianManyResponse, TechnicianResponse } from './dto/response';
import { TechnicianFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('Technician')
@Controller('technician')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

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
  async create(@Body() createTechnicianDto: CreateTechnicianDto) {
    return await this.technicianService.create(createTechnicianDto);
  }

  @ApiOkResponse({ type: TechnicianManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() filterDto: TechnicianFilterDto,
    @Query() paginationDto: PaginationDto,
  ): Promise<TechnicianManyResponse> {
    return this.technicianService.findMany({
      filterDto,
      paginationDto,
    });
  }
}
