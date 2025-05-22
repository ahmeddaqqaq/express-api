import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
}
