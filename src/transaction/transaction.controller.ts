import {
  Body,
  Controller,
  Get,
  Param,
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
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
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
    type: TransactionManyResponse,
  })
  @Get('findMany')
  async findMany(
    @Query() filterDto: TransactionFilterDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.transactionService.findMany({ filterDto, paginationDto });
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
    type: [TransactionResponse],
  })
  @Get('findScheduled')
  async findScheduled() {
    return await this.transactionService.findScheduled();
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
    type: [TransactionResponse],
  })
  @Get('findInProgressStageOne')
  async findStageOne() {
    return await this.transactionService.findStageOne();
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
    type: [TransactionResponse],
  })
  @Get('findInProgressStageTwo')
  async findStageTwo() {
    return await this.transactionService.findStageTwo();
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
    type: [TransactionResponse],
  })
  @Get('findCompleted')
  async findCompleted() {
    return await this.transactionService.findCompleted();
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

  @Patch(':id/upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Transaction ID (UUID)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image to a transaction' })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async uploadTransactionImage(
    @Param('id') transactionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.transactionService.uploadTransactionImage(transactionId, file);
  }
}
