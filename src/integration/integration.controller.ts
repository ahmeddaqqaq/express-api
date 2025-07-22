import { Controller, Get, Post, Param, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Integration')
@Controller('Integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('findMany')
  @ApiOperation({ summary: 'Get all services and add-ons for POS integration' })
  @ApiResponse({
    status: 200,
    description: 'Returns services and add-ons mapped to POS format',
  })
  async findMany() {
    return this.integrationService.findMany();
  }

  @Get('pos-orders')
  @ApiOperation({ summary: 'Get all POS orders' })
  @ApiResponse({
    status: 200,
    description: 'Returns all POS orders with transaction details',
  })
  async getAllPosOrders() {
    return this.integrationService.getAllPosOrders();
  }

  @Get('pos-orders/transaction/:transactionId')
  @ApiOperation({ summary: 'Get POS order by transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns POS order for specific transaction',
  })
  @ApiResponse({
    status: 404,
    description: 'POS order not found',
  })
  async getPosOrderByTransaction(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.integrationService.getPosOrderByTransactionId(transactionId);
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
  async markTransactionAsPaid(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.integrationService.markTransactionAsPaid(orderId);
  }
}
