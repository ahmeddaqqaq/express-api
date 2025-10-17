import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async create(createReservationDto: CreateReservationDto) {
    const { customerId, datetime, notes } = createReservationDto;

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has an active subscription
    const activeSubscription = await this.prisma.customerSubscription.findFirst(
      {
        where: {
          customerId,
          isActive: true,
          activationDate: { not: null },
          expiryDate: { gte: new Date() },
        },
        include: {
          subscription: true,
        },
      },
    );

    if (!activeSubscription) {
      throw new BadRequestException(
        'Customer does not have an active subscription. Reservations are only available for subscribed customers.',
      );
    }

    // Create reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        customerId,
        datetime: new Date(datetime),
        notes,
      },
      include: {
        customer: true,
      },
    });

    return this.formatReservationResponse(reservation);
  }

  async findAll(date?: string) {
    const whereCondition: any = {
      markAsDone: false,
      isActive: true,
    };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereCondition.datetime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const reservations = await this.prisma.reservation.findMany({
      where: whereCondition,
      include: {
        customer: true,
      },
      orderBy: {
        datetime: 'asc',
      },
    });

    return reservations.map((reservation) =>
      this.formatReservationResponse(reservation),
    );
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return this.formatReservationResponse(reservation);
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const existingReservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!existingReservation) {
      throw new NotFoundException('Reservation not found');
    }

    const updateData: any = {};

    if (updateReservationDto.datetime) {
      updateData.datetime = new Date(updateReservationDto.datetime);
    }

    if (updateReservationDto.notes !== undefined) {
      updateData.notes = updateReservationDto.notes;
    }

    if (updateReservationDto.markAsDone !== undefined) {
      updateData.markAsDone = updateReservationDto.markAsDone;
    }

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
      },
    });

    return this.formatReservationResponse(reservation);
  }

  async delete(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    await this.prisma.reservation.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Reservation deleted successfully' };
  }

  private formatReservationResponse(reservation: any) {
    return {
      id: reservation.id,
      customer: {
        id: reservation.customer.id,
        firstName: reservation.customer.fName,
        lastName: reservation.customer.lName,
        fullName: `${reservation.customer.fName} ${reservation.customer.lName}`,
        mobileNumber: reservation.customer.mobileNumber,
      },
      datetime: reservation.datetime,
      notes: reservation.notes,
      markAsDone: reservation.markAsDone,
      isActive: reservation.isActive,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
