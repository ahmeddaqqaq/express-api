import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  ParseUUIDPipe,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TechnicianService } from './technician.service';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTechnicianDto } from './dto/create-technician-dto';
import { TechnicianManyResponse } from './dto/response';
import { TechnicianFilterDto } from './dto/filter.dto';
import { PaginationDto } from 'src/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { TransactionStatus } from '@prisma/client';
import { AuditLogService } from 'src/audit-log/audit-log.service';

@ApiTags('Technician')
@Controller('technician')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class TechnicianController {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly auditLogService: AuditLogService,
  ) {}

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
  @ApiOperation({
    summary: 'Create a new technician',
    description:
      'Create a new technician with first name, last name, and active status',
  })
  @ApiResponse({
    status: 201,
    description: 'Technician created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
  })
  async create(@Body() createTechnicianDto: CreateTechnicianDto) {
    return await this.technicianService.create(createTechnicianDto);
  }

  @Get('findMany')
  @ApiOperation({
    summary: 'Find technicians with pagination',
    description:
      'Get a paginated list of technicians with their work statistics and latest actions',
  })
  @ApiOkResponse({ type: TechnicianManyResponse })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip for pagination',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to return (max 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by technician name',
  })
  async findMany(
    @Query() filterDto: TechnicianFilterDto,
    @Query() paginationDto: PaginationDto,
  ): Promise<TechnicianManyResponse> {
    return this.technicianService.findMany({
      filterDto,
      paginationDto,
    });
  }

  @Get('active-shifts')
  @ApiOperation({
    summary: 'Get technicians with active shifts',
    description:
      'Get all technicians who have active shifts or overtime for today (for ticket assignment)',
  })
  @ApiResponse({
    status: 200,
    description: 'Active shift technicians retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fName: { type: 'string' },
          lName: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  })
  async getActiveShiftTechnicians() {
    return this.technicianService.findActiveShiftTechnicians();
  }

  // --- SHIFT CONTROLS ---

  @Post(':id/start-shift')
  @ApiOperation({
    summary: 'Start technician shift',
    description: 'Start a new work shift for the technician',
  })
  @ApiResponse({ status: 200, description: 'Shift started successfully' })
  @ApiResponse({
    status: 400,
    description: 'Shift already started or validation error',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async startShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startShift(id);
  }

  @Post(':id/end-shift')
  @ApiOperation({
    summary: 'End technician shift',
    description: 'End the current work shift for the technician',
  })
  @ApiResponse({ status: 200, description: 'Shift ended successfully' })
  @ApiResponse({
    status: 400,
    description: 'No active shift or validation error',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async endShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endShift(id);
  }

  // --- BREAK CONTROLS ---

  @Post(':id/start-break')
  @ApiOperation({
    summary: 'Start technician break',
    description: 'Start a break during active shift',
  })
  @ApiResponse({ status: 200, description: 'Break started successfully' })
  @ApiResponse({
    status: 400,
    description: 'No active shift or break already started',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async startBreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startBreak(id);
  }

  @Post(':id/end-break')
  @ApiOperation({
    summary: 'End technician break',
    description: 'End the current break during active shift',
  })
  @ApiResponse({ status: 200, description: 'Break ended successfully' })
  @ApiResponse({
    status: 400,
    description: 'No active break or validation error',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async endBreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endBreak(id);
  }

  // --- OVERTIME CONTROLS ---

  @Post(':id/start-overtime')
  @ApiOperation({
    summary: 'Start technician overtime',
    description: 'Start overtime work during active shift',
  })
  @ApiResponse({ status: 200, description: 'Overtime started successfully' })
  @ApiResponse({
    status: 400,
    description: 'No active shift or overtime already started',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async startOvertime(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startOvertime(id);
  }

  @Post(':id/end-overtime')
  @ApiOperation({
    summary: 'End technician overtime',
    description: 'End the current overtime work during active shift',
  })
  @ApiResponse({ status: 200, description: 'Overtime ended successfully' })
  @ApiResponse({
    status: 400,
    description: 'No active overtime or validation error',
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async endOvertime(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endOvertime(id);
  }

  @Get(':id/daily-working-hours')
  @ApiOperation({
    summary: 'Get technician daily working hours',
    description: 'Get detailed working hours breakdown for a specific date',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date to get working hours for (YYYY-MM-DD format)',
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Working hours retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        shiftTime: { type: 'string', example: '08:00:00' },
        breakTime: { type: 'string', example: '01:00:00' },
        overtimeTime: { type: 'string', example: '02:00:00' },
        totalWorkingTime: { type: 'string', example: '09:00:00' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async getDailyWorkingHours(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.technicianService.getDailyWorkingHours(id, date);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update technician details',
    description: 'Update technician information (name, status, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Technician updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTechnicianDto: CreateTechnicianDto,
  ) {
    return this.technicianService.update(id, updateTechnicianDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete technician',
    description: 'Remove a technician from the system',
  })
  @ApiResponse({ status: 200, description: 'Technician deleted successfully' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.delete(id);
  }

  // --- TRANSACTION WORK MANAGEMENT ---

  @Post(':id/start-work')
  @ApiOperation({
    summary: 'Start work on transaction phase',
    description:
      'Record when a technician starts working on a specific transaction phase',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', format: 'uuid' },
        phase: { type: 'string', enum: Object.values(TransactionStatus) },
      },
      required: ['transactionId', 'phase'],
    },
  })
  @ApiResponse({ status: 200, description: 'Work started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 404,
    description: 'Technician or transaction not found',
  })
  async startWorkOnTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workData: { transactionId: string; phase: TransactionStatus },
  ) {
    return this.auditLogService.startWorkOnTransaction(
      id,
      workData.transactionId,
      workData.phase,
    );
  }

  @Post(':id/complete-work')
  @ApiOperation({
    summary: 'Complete work on transaction phase',
    description:
      'Record when a technician completes work on a specific transaction phase',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', format: 'uuid' },
        phase: { type: 'string', enum: Object.values(TransactionStatus) },
      },
      required: ['transactionId', 'phase'],
    },
  })
  @ApiResponse({ status: 200, description: 'Work completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 404,
    description: 'Technician or transaction not found',
  })
  async completeWorkOnTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workData: { transactionId: string; phase: TransactionStatus },
  ) {
    return this.auditLogService.completeWorkOnTransaction(
      id,
      workData.transactionId,
      workData.phase,
    );
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get technician assignments by technician ID' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active assignments',
  })
  @ApiResponse({
    status: 200,
    description: 'Technician assignments retrieved successfully',
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
          transaction: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              customer: {
                type: 'object',
                properties: {
                  fName: { type: 'string' },
                  lName: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getTechnicianAssignments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.auditLogService.getTechnicianAssignments(id, isActive);
  }

  @Get(':id/audit-logs')
  @ApiOperation({
    summary: 'Get technician audit logs',
    description:
      'Get paginated audit logs for a specific technician showing all their activities',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              phase: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              metadata: { type: 'object', nullable: true },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async getTechnicianAuditLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.auditLogService.findByTechnician(id, paginationDto);
  }
}
