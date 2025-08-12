import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalesDto } from './dto/create-sales.dto';
import { UpdateSalesDto } from './dto/update-sales.dto';
import { SalesFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesResponse, SalesManyResponse } from './dto/response';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new sales person' })
  @ApiResponse({
    status: 201,
    description: 'Sales person created successfully',
    type: SalesResponse,
  })
  @ApiResponse({
    status: 409,
    description: 'Sales person with this mobile number already exists',
  })
  create(@Body() createSalesDto: CreateSalesDto) {
    return this.salesService.create(createSalesDto);
  }

  @Get()
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get all sales persons with filters' })
  @ApiResponse({
    status: 200,
    description: 'Sales persons retrieved successfully',
    type: SalesManyResponse,
  })
  findMany(
    @Query() filterDto: SalesFilterDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.salesService.findMany({ filterDto, paginationDto });
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get a sales person by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sales person retrieved successfully',
    type: SalesResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Sales person not found',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOne(id);
  }

  @Patch()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a sales person' })
  @ApiResponse({
    status: 200,
    description: 'Sales person updated successfully',
    type: SalesResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Sales person not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Sales person with this mobile number already exists',
  })
  update(@Body() updateSalesDto: UpdateSalesDto) {
    return this.salesService.update(updateSalesDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a sales person' })
  @ApiResponse({
    status: 200,
    description: 'Sales person deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Sales person not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete sales person with active assignments',
  })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.delete(id);
  }
}