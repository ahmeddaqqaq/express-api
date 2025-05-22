import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/customer-create.dto';
import { FindOneCustomerDto } from './dto/find-one-dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponse, CustomersManyResponse } from './responses';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CustomerFilterDto } from './dto/filter-dto';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

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
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    return await this.customerService.create({ createCustomerDto });
  }

  @ApiOkResponse({ type: CustomersManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: CustomerFilterDto,
  ): Promise<CustomersManyResponse> {
    return this.customerService.findMany({ paginationDto, filterDto });
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
    type: CustomerResponse,
  })
  @Get(':id')
  async findOne(@Query() findOneCustomerDto: FindOneCustomerDto) {
    return await this.customerService.findOne({ findOneCustomerDto });
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
  @Patch('update')
  async update(@Body() updateCustomerDto: UpdateCustomerDto) {
    return await this.customerService.update(updateCustomerDto);
  }
}
