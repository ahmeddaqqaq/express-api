import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/update-transaction-dto';
import { TransactionManyResponse, TransactionResponse } from './dto/response';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';

@ApiTags('Transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('create')
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
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
  }

  @Get('findMany')
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
    type: TransactionManyResponse,
  })
  async findMany(
    @Query() filterDto: TransactionFilterDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.transactionService.findMany({ filterDto, paginationDto });
  }

  @Get('findScheduled')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format)',
    example: '2023-12-31',
  })
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
    type: [TransactionResponse],
  })
  async findScheduled(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findScheduled(filterDate);
  }

  @Get('findInProgressStageOne')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format)',
    example: '2023-12-31',
  })
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
    type: [TransactionResponse],
  })
  async findStageOne(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageOne(filterDate);
  }

  @Get('findInProgressStageTwo')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format)',
    example: '2023-12-31',
  })
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
    type: [TransactionResponse],
  })
  async findStageTwo(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageTwo(filterDate);
  }

  @Get('findInProgressStageThree')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format)',
    example: '2023-12-31',
  })
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
    type: [TransactionResponse],
  })
  async findStageThree(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageThree(filterDate);
  }

  @Get('findCompleted')
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format)',
    example: '2023-12-31',
  })
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
    type: [TransactionResponse],
  })
  async findCompleted(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findCompleted(filterDate);
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
  async update(@Body() updateTransactionDto: UpdateTransactionDto) {
    return await this.transactionService.update(updateTransactionDto);
  }

  @Patch(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image to transaction' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.transactionService.uploadTransactionImages(transactionId, [
      file,
    ]);
  }
}
