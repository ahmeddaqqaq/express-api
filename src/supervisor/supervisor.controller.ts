import { Body, Controller, Get, Post, Query, Param, ParseUUIDPipe, Delete, Put } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSuperVisorDto } from './dto/create-supervisor.dto';
import { SupervisorManyResponse } from './dto/response';
import { SupervisorFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('Supervisor')
@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

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
  async create(@Body() createSuperVisorDto: CreateSuperVisorDto) {
    return await this.supervisorService.create(createSuperVisorDto);
  }

  @ApiOkResponse({ type: SupervisorManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() filterDto: SupervisorFilterDto,
    @Query() paginationDto: PaginationDto,
  ): Promise<SupervisorManyResponse> {
    return this.supervisorService.findMany({
      filterDto,
      paginationDto,
    });
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupervisorDto: CreateSuperVisorDto,
  ) {
    return this.supervisorService.update(id, updateSupervisorDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervisorService.delete(id);
  }
}
