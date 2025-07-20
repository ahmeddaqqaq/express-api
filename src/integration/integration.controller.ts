import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
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
}
