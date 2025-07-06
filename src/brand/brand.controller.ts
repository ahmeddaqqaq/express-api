import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBrandDto } from './dto/create-brand-dto';
import { BrandManyResponse, BrandResponse } from './dto/response';
import { BrandFilterDto } from './dto/filter-dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('Brand')
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

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
  async create(@Body() createBrandDto: CreateBrandDto) {
    return await this.brandService.create(createBrandDto);
  }

  @ApiOkResponse({ type: BrandManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: BrandFilterDto,
  ): Promise<BrandManyResponse> {
    return this.brandService.findMany({ paginationDto, filterDto });
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
  async update(@Param('id') id: string, @Body() updateBrandDto: CreateBrandDto) {
    return await this.brandService.update(id, updateBrandDto);
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
    return await this.brandService.delete(id);
  }
}
