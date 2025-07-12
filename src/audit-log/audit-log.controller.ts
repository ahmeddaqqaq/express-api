import { Controller, Get, Query, UseGuards, Param, ParseUUIDPipe, Post, Body } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { ApiOkResponse, ApiQuery, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaginationDto } from 'src/dto/pagination.dto';
import { AuditLogManyResponse } from './response';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { TransactionStatus } from '@prisma/client';

@ApiTags('Audit-Log')
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOkResponse({ type: AuditLogManyResponse })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Get('findMany')
  async findMany(@Query() paginationDto: PaginationDto) {
    return this.auditLogService.findAll({
      paginationDto,
    });
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get audit logs for a specific transaction' })
  async getTransactionLogs(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.auditLogService.findByTransaction(transactionId);
  }

  @Get('technician/:technicianId')
  @ApiOperation({ summary: 'Get audit logs for a specific technician' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getTechnicianLogs(
    @Param('technicianId', ParseUUIDPipe) technicianId: string,
    @Query() paginationDto?: PaginationDto
  ) {
    return this.auditLogService.findByTechnician(technicianId, paginationDto);
  }

  @Get('transaction/:transactionId/work-history')
  @ApiOperation({ summary: 'Get complete work history for a transaction' })
  async getTransactionWorkHistory(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.auditLogService.getTransactionWorkHistory(transactionId);
  }

  @Get('transaction/:transactionId/assignments')
  @ApiOperation({ summary: 'Get technician assignments for a transaction' })
  async getTransactionAssignments(@Param('transactionId', ParseUUIDPipe) transactionId: string) {
    return this.auditLogService.getTransactionAssignments(transactionId);
  }

  @Get('technician/:technicianId/assignments')
  @ApiOperation({ summary: 'Get assignments for a technician' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async getTechnicianAssignments(
    @Param('technicianId', ParseUUIDPipe) technicianId: string,
    @Query('isActive') isActive?: boolean
  ) {
    return this.auditLogService.getTechnicianAssignments(technicianId, isActive);
  }

  @Post('assign-technician')
  @ApiOperation({ summary: 'Assign technician to transaction phase' })
  async assignTechnician(@Body() assignmentData: {
    technicianId: string;
    transactionId: string;
    phase: TransactionStatus;
  }) {
    return this.auditLogService.assignTechnicianToPhase(
      assignmentData.technicianId,
      assignmentData.transactionId,
      assignmentData.phase
    );
  }

  @Post('start-work')
  @ApiOperation({ summary: 'Start work on transaction phase' })
  async startWork(@Body() workData: {
    technicianId: string;
    transactionId: string;
    phase: TransactionStatus;
  }) {
    return this.auditLogService.startWorkOnTransaction(
      workData.technicianId,
      workData.transactionId,
      workData.phase
    );
  }

  @Post('complete-work')
  @ApiOperation({ summary: 'Complete work on transaction phase' })
  async completeWork(@Body() workData: {
    technicianId: string;
    transactionId: string;
    phase: TransactionStatus;
  }) {
    return this.auditLogService.completeWorkOnTransaction(
      workData.technicianId,
      workData.transactionId,
      workData.phase
    );
  }
}
