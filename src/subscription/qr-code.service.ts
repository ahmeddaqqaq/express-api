import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QRCodeService {
  constructor(private prisma: PrismaService) {}

  generateCode(): string {
    // Generate a 16-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async generateQRCodes(count: number = 1) {
    const codes = [];

    for (let i = 0; i < count; i++) {
      let code = this.generateCode();

      // Ensure uniqueness
      while (await this.prisma.qRCode.findUnique({ where: { code } })) {
        code = this.generateCode();
      }

      const qrCode = await this.prisma.qRCode.create({
        data: { code },
      });

      codes.push(qrCode);
    }

    return codes;
  }

  async getAvailableQRCodes() {
    return this.prisma.qRCode.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllQRCodes() {
    return this.prisma.qRCode.findMany({
      include: {
        customerSubscriptions: {
          where: { isActive: true },
          include: {
            customer: true,
            car: {
              include: {
                brand: true,
                model: true,
              },
            },
            subscription: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCode(code: string) {
    return this.prisma.qRCode.findUnique({
      where: { code },
      include: {
        customerSubscriptions: {
          where: { isActive: true },
          include: {
            customer: true,
            car: {
              include: {
                brand: true,
                model: true,
              },
            },
            subscription: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }
}
