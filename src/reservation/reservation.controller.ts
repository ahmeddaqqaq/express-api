import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new reservation',
    description:
      'Creates a reservation for a customer. Customer must have an active subscription.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    type: ReservationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Customer does not have an active subscription',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reservations',
    description:
      'Retrieves all active reservations that are not marked as done. Optionally filter by date.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter reservations by date (YYYY-MM-DD)',
    example: '2025-10-18',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reservations',
    type: [ReservationResponseDto],
  })
  findAll(@Query('date') date?: string) {
    return this.reservationService.findAll(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation details',
    type: ReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a reservation',
    description:
      'Updates reservation details including datetime, notes, or mark as done status',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation updated successfully',
    type: ReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a reservation',
    description: 'Soft deletes a reservation by setting isActive to false',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  delete(@Param('id') id: string) {
    return this.reservationService.delete(id);
  }
}
