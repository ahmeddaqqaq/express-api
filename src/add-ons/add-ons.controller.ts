import { Body, Controller, Get, Post, Query, Param, ParseUUIDPipe, Delete, Put } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAddOnDto } from './dto/create-add-on-dto';
import { AddOnsManyResponse, AddOnsResponse } from './dto/respons';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('Add-ons')
@Controller('add-ons')
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

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
  async create(@Body() createAddOnDto: CreateAddOnDto) {
    return await this.addOnsService.create(createAddOnDto);
  }

  @ApiOkResponse({ type: AddOnsManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() paginationDto: PaginationDto,
  ): Promise<AddOnsManyResponse> {
    return this.addOnsService.findAll({ paginationDto });
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddOnDto: CreateAddOnDto,
  ) {
    return this.addOnsService.update(id, updateAddOnDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.addOnsService.delete(id);
  }
}
