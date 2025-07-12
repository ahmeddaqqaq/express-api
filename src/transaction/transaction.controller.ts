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
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/update-transaction-dto';
import { TransactionManyResponse, TransactionResponse } from './dto/response';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { TransactionStatus } from '@prisma/client';

@ApiTags('Transaction')
@Controller('transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponse,
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

  @ApiOperation({ summary: 'Update transaction status and details' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
    type: TransactionResponse,
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
  })
  @Patch('update')
  async update(@Body() updateTransactionDto: UpdateTransactionDto) {
    return await this.transactionService.update(updateTransactionDto);
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
  @Post('calculate-total')
  async calculateTotal(
    @Body()
    calculateTotalDto: CalculateTotalDto,
  ) {
    return this.transactionService.calculateTotal(calculateTotalDto);
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

  @Get(':id/images')
  @ApiOperation({ summary: 'Get transaction images filtered by stage' })
  @ApiQuery({
    name: 'stage',
    required: false,
    enum: TransactionStatus,
    description: 'Filter images by upload stage',
  })
  @ApiResponse({
    status: 200,
    description: 'Images retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          key: { type: 'string' },
          url: { type: 'string' },
          isActive: { type: 'boolean' },
          uploadedAtStage: { type: 'string', enum: Object.values(TransactionStatus) },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getTransactionImages(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Query('stage') stage?: TransactionStatus,
  ) {
    return this.transactionService.getTransactionImagesByStage(transactionId, stage);
  }

  @Get(':id/images/grouped')
  @ApiOperation({ summary: 'Get transaction images grouped by upload stage' })
  @ApiResponse({
    status: 200,
    description: 'Images grouped by stage retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            key: { type: 'string' },
            url: { type: 'string' },
            isActive: { type: 'boolean' },
            uploadedAtStage: { type: 'string', enum: Object.values(TransactionStatus) },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getTransactionImagesGrouped(
    @Param('id', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionService.getAllImagesGroupedByStage(transactionId);
  }
}
