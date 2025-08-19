import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Integration')
@Controller('Integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('findMany')
  @ApiOperation({ summary: 'Get all pos tickets' })
  @ApiResponse({
    status: 200,
    description: 'Returns services and add-ons mapped to POS format',
  })
  async findMany() {
    return this.integrationService.findMany();
  }

  @Post('mark-paid/:orderId')
  @ApiOperation({ summary: 'Mark transaction as paid by order number' })
  @ApiResponse({
    status: 200,
    description: 'Transaction marked as paid successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Transaction is already marked as paid',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async markTransactionAsPaid(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.integrationService.markTransactionAsPaid(orderId);
  }

  @Post('mark-pulled/:orderId')
  @ApiOperation({ summary: 'Mark transaction as pulled by order number' })
  @ApiResponse({
    status: 200,
    description: 'Transaction marked as pulled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Transaction is already marked as pulled',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found',
  })
  async markTransactionAsPulled(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.integrationService.markTransactionAsPulled(orderId);
  }
}
