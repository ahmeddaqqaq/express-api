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
import { ApiOkResponse, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    private readonly auditLogService: AuditLogService
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
  async create(@Body() createTechnicianDto: CreateTechnicianDto) {
    return await this.technicianService.create(createTechnicianDto);
  }

  @ApiOkResponse({ type: TechnicianManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(
    @Query() filterDto: TechnicianFilterDto,
    @Query() paginationDto: PaginationDto,
  ): Promise<TechnicianManyResponse> {
    return this.technicianService.findMany({
      filterDto,
      paginationDto,
    });
  }

  // --- SHIFT CONTROLS ---

  @Post(':id/start-shift')
  async startShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startShift(id);
  }

  @Post(':id/end-shift')
  async endShift(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endShift(id);
  }

  // --- BREAK CONTROLS ---

  @Post(':id/start-break')
  async startBreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startBreak(id);
  }

  @Post(':id/end-break')
  async endBreak(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endBreak(id);
  }

  // --- OVERTIME CONTROLS ---

  @Post(':id/start-overtime')
  async startOvertime(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.startOvertime(id);
  }

  @Post(':id/end-overtime')
  async endOvertime(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.endOvertime(id);
  }

  @Get(':id/daily-working-hours')
  async getDailyWorkingHours(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.technicianService.getDailyWorkingHours(id, date);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTechnicianDto: CreateTechnicianDto,
  ) {
    return this.technicianService.update(id, updateTechnicianDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.technicianService.delete(id);
  }

  // --- TRANSACTION WORK MANAGEMENT ---

  @Post(':id/start-work')
  async startWorkOnTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workData: { transactionId: string; phase: TransactionStatus }
  ) {
    return this.auditLogService.startWorkOnTransaction(id, workData.transactionId, workData.phase);
  }

  @Post(':id/complete-work')
  async completeWorkOnTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() workData: { transactionId: string; phase: TransactionStatus }
  ) {
    return this.auditLogService.completeWorkOnTransaction(id, workData.transactionId, workData.phase);
  }

  @Get(':id/assignments')
  async getTechnicianAssignments(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('isActive') isActive?: boolean
  ) {
    return this.auditLogService.getTechnicianAssignments(id, isActive);
  }

  @Get(':id/audit-logs')
  async getTechnicianAuditLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationDto?: PaginationDto
  ) {
    return this.auditLogService.findByTechnician(id, paginationDto);
  }
}
