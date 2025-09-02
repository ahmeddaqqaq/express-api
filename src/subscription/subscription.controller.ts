import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { QRCodeService } from './qr-code.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/create-subscription.dto';
import {
  PurchaseSubscriptionDto,
  ActivateSubscriptionDto,
} from './dto/purchase-subscription.dto';
import { UseServiceDto } from './dto/use-service.dto';
import {
  SubscriptionResponseDto,
  CustomerSubscriptionResponseDto,
} from './dto/subscription-response.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly qrCodeService: QRCodeService,
  ) {}

  @Post('create')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Create a new subscription template' })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Get()
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get all active subscription templates' })
  @ApiResponse({ status: 200, type: [SubscriptionResponseDto] })
  async findAll() {
    return this.subscriptionService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get subscription template by ID' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Update subscription template' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Delete subscription template' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete subscription with active customers',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.delete(id);
  }

  // Customer Subscription Operations

  @Post('purchase')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Purchase a subscription for a customer' })
  @ApiResponse({
    status: 201,
    description: 'Subscription purchased successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer, Car, or Subscription not found',
  })
  @ApiResponse({ status: 400, description: 'Invalid purchase data' })
  async purchaseSubscription(@Body() purchaseDto: PurchaseSubscriptionDto) {
    return this.subscriptionService.purchaseSubscription(purchaseDto);
  }

  @Post('activate')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Activate a purchased subscription with QR code' })
  @ApiResponse({
    status: 200,
    description: 'Subscription activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer subscription or QR code not found',
  })
  @ApiResponse({ status: 409, description: 'QR code already in use' })
  async activateSubscription(@Body() activateDto: ActivateSubscriptionDto) {
    return this.subscriptionService.activateSubscription(activateDto);
  }

  @Get('pending-activations')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Get all purchased subscriptions pending activation',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscriptions waiting for QR code activation',
  })
  async getPendingActivations() {
    return this.subscriptionService.getPendingActivations();
  }

  @Get('customer/:customerId')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get all subscriptions for a customer' })
  @ApiResponse({ status: 200, type: [CustomerSubscriptionResponseDto] })
  async getCustomerSubscriptions(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.subscriptionService.getCustomerSubscriptions(customerId);
  }

  @Get('qr/:qrCode')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get subscription details by QR code' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found for QR code',
  })
  async getSubscriptionByQR(@Param('qrCode') qrCode: string) {
    return this.subscriptionService.getSubscriptionByQR(qrCode);
  }

  @Post('use-service')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Use a service from subscription via QR code' })
  @ApiResponse({ status: 200, description: 'Service used successfully' })
  @ApiResponse({ status: 404, description: 'QR code or service not found' })
  @ApiResponse({
    status: 400,
    description: 'Service not available or no remaining uses',
  })
  async useService(@Body() useServiceDto: UseServiceDto) {
    return this.subscriptionService.useService(useServiceDto);
  }

  // QR Code Management

  @Post('qr/generate')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Generate new QR codes' })
  @ApiQuery({
    name: 'count',
    type: 'number',
    required: false,
    description: 'Number of QR codes to generate (default: 1)',
  })
  @ApiResponse({ status: 201, description: 'QR codes generated successfully' })
  async generateQRCodes(@Query('count') count?: string) {
    const codeCount = count ? parseInt(count, 10) : 1;
    return this.qrCodeService.generateQRCodes(codeCount);
  }

  @Get('qr/available')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get all available (unused) QR codes' })
  @ApiResponse({ status: 200, description: 'List of available QR codes' })
  async getAvailableQRCodes() {
    return this.qrCodeService.getAvailableQRCodes();
  }

  @Get('qr/all')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Get all QR codes with their usage status' })
  @ApiResponse({ status: 200, description: 'List of all QR codes' })
  async getAllQRCodes() {
    return this.qrCodeService.getAllQRCodes();
  }

  @Get('qr/find/:code')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({ summary: 'Find QR code by code string' })
  @ApiResponse({ status: 200, description: 'QR code details' })
  @ApiResponse({ status: 404, description: 'QR code not found' })
  async findQRByCode(@Param('code') code: string) {
    return this.qrCodeService.findByCode(code);
  }
}
