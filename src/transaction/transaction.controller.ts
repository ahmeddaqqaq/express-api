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
import { UpdateTransactionDto, EditScheduledTransactionDto } from './dto/update-transaction-dto';
import { TransactionManyResponse, TransactionResponse } from './dto/response';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { TransactionStatus } from '@prisma/client';
import { AssignTechnicianToPhaseDto } from './dto/update-transaction-dto';

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
  @ApiOperation({ 
    summary: 'Find transactions with pagination and filtering',
    description: 'Get a paginated list of transactions with optional search and date filtering. If no date is provided, returns all transactions.'
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: TransactionManyResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid pagination or filter parameters',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findMany(
    @Query() filterDto: TransactionFilterDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.transactionService.findMany({ filterDto, paginationDto });
  }

  @Get('findScheduled')
  @ApiOperation({
    summary: 'Find scheduled transactions',
    description: 'Get all transactions in scheduled status, optionally filtered by creation date'
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format) to filter by creation date',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled transactions retrieved successfully',
    type: [TransactionResponse],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findScheduled(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findScheduled(filterDate);
  }

  @Get('findInProgressStageOne')
  @ApiOperation({
    summary: 'Find transactions in stage one',
    description: 'Get all transactions currently in stageOne status, optionally filtered by date'
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format) to filter by creation date',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Stage one transactions retrieved successfully',
    type: [TransactionResponse],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findStageOne(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageOne(filterDate);
  }

  @Get('findInProgressStageTwo')
  @ApiOperation({
    summary: 'Find transactions in stage two',
    description: 'Get all transactions currently in stageTwo status, optionally filtered by date'
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format) to filter by creation or update date',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Stage two transactions retrieved successfully',
    type: [TransactionResponse],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findStageTwo(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageTwo(filterDate);
  }

  @Get('findInProgressStageThree')
  @ApiOperation({
    summary: 'Find transactions in stage three',
    description: 'Get all transactions currently in stageThree status, optionally filtered by date'
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format) to filter by creation or update date',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Stage three transactions retrieved successfully',
    type: [TransactionResponse],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findStageThree(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findStageThree(filterDate);
  }

  @Get('findCompleted')
  @ApiOperation({
    summary: 'Find completed transactions',
    description: 'Get all completed transactions, optionally filtered by completion date'
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date filter (YYYY-MM-DD format) to filter by completion date',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Completed transactions retrieved successfully',
    type: [TransactionResponse],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid date format',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async findCompleted(@Query('date') date?: string) {
    const filterDate = date ? new Date(date) : undefined;
    return await this.transactionService.findCompleted(filterDate);
  }

  @Get('findCancelled')
  @ApiOperation({
    summary: 'Find cancelled transactions',
    description: 'Get all transactions with cancelled status'
  })
  @ApiResponse({
    status: 200,
    description: 'Cancelled transactions retrieved successfully',
    type: [TransactionResponse],
  })
  async findCancelled() {
    return await this.transactionService.findCancelled();
  }

  @ApiOperation({ summary: 'Update transaction status and details' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
    type: TransactionResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid phase progression',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @Patch('update')
  async update(@Body() updateTransactionDto: UpdateTransactionDto) {
    return await this.transactionService.update(updateTransactionDto);
  }

  @ApiOperation({ 
    summary: 'Edit scheduled transaction details',
    description: 'Edit service, addons, delivery time, and notes for transactions in scheduled status only'
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled transaction edited successfully',
    type: TransactionResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - transaction not in scheduled status or invalid data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction, service, or addon not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @Patch('edit-scheduled')
  async editScheduled(@Body() editDto: EditScheduledTransactionDto) {
    return await this.transactionService.editScheduledTransaction(editDto);
  }

  @ApiOperation({ 
    summary: 'Calculate total price for transaction',
    description: 'Calculate total price based on service type, car type, and selected addons'
  })
  @ApiResponse({
    status: 200,
    description: 'Total calculated successfully',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total price including service and addons',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Car, service, or addon not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
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
  @ApiOperation({ 
    summary: 'Upload image to transaction',
    description: 'Upload an image file to a transaction. Image will be tagged with current transaction status/phase.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload (JPEG, PNG, etc.)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              key: { type: 'string' },
              url: { type: 'string' },
              uploadedAtStage: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file type or no file provided',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
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

  @Post('assign-technician')
  @ApiOperation({ summary: 'Assign technician to a specific phase of a transaction' })
  @ApiResponse({
    status: 201,
    description: 'Technician assigned successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        technicianId: { type: 'string' },
        transactionId: { type: 'string' },
        phase: { type: 'string', enum: ['stageOne', 'stageTwo', 'stageThree'] },
        assignedAt: { type: 'string', format: 'date-time' },
        technician: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fName: { type: 'string' },
            lName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phase or technician already assigned',
  })
  async assignTechnicianToPhase(
    @Body() assignTechnicianDto: AssignTechnicianToPhaseDto,
  ) {
    return this.transactionService.assignTechnicianToPhase(
      assignTechnicianDto.transactionId,
      assignTechnicianDto.technicianId,
      assignTechnicianDto.phase,
    );
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get all technician assignments for a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          technicianId: { type: 'string' },
          transactionId: { type: 'string' },
          phase: { type: 'string', enum: Object.values(TransactionStatus) },
          assignedAt: { type: 'string', format: 'date-time' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          isActive: { type: 'boolean' },
          technician: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fName: { type: 'string' },
              lName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getTransactionAssignments(
    @Param('id', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionService.getTransactionAssignments(transactionId);
  }

  @Get(':id/assignments/:phase')
  @ApiOperation({ summary: 'Get technician assignments for a specific phase' })
  @ApiQuery({
    name: 'phase',
    enum: ['stageOne', 'stageTwo', 'stageThree'],
    description: 'Phase to get assignments for',
  })
  @ApiResponse({
    status: 200,
    description: 'Phase assignments retrieved successfully',
  })
  async getPhaseAssignments(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Param('phase') phase: 'stageOne' | 'stageTwo' | 'stageThree',
  ) {
    return this.transactionService.getPhaseAssignments(transactionId, phase);
  }

}
