import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationService } from '../integration/integration.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/create-subscription.dto';
import {
  PurchaseSubscriptionDto,
  ActivateSubscriptionDto,
} from './dto/purchase-subscription.dto';
import { UseServiceDto } from './dto/use-service.dto';
import { AssignQRCodeDto } from './dto/assign-subscription.dto';
import { CarType, TransactionStatus } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private integrationService: IntegrationService,
  ) {}

  logger = new Logger('SubscriptionService');

  private async sendSMS(mobileNumber: string, message: string): Promise<void> {
    try {
      const otpUrl = `${process.env.OTP_SERVICE_URL}&msg=${encodeURIComponent(
        message,
      )}&numbers=${'962' + mobileNumber.slice(1)}`;

      await axios.get(otpUrl, {
        timeout: 10000,
      });

      this.logger.log(`SMS sent successfully to ${mobileNumber}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send SMS to ${mobileNumber}: ${error.message}`,
      );
    }
  }

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const { name, description, endDate, maxUsesPerService, services, prices } =
      createSubscriptionDto;

    // Validate that all services exist
    const serviceIds = services.map((s) => s.serviceId);
    const existingServices = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    if (existingServices.length !== serviceIds.length) {
      throw new BadRequestException('One or more services do not exist');
    }

    // Validate that all car types are covered in pricing
    const requiredCarTypes = Object.values(CarType);
    const providedCarTypes = prices.map((p) => p.carType);
    const missingCarTypes = requiredCarTypes.filter(
      (ct) => !providedCarTypes.includes(ct),
    );

    if (missingCarTypes.length > 0) {
      throw new BadRequestException(
        `Missing pricing for car types: ${missingCarTypes.join(', ')}`,
      );
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        name,
        description,
        endDate: endDate ? new Date(endDate) : null,
        maxUsesPerService,
        subscriptionServices: {
          create: services.map((s) => ({
            serviceId: s.serviceId,
            usageCount: s.usageCount,
          })),
        },
        subscriptionPrices: {
          create: prices.map((p) => ({
            carType: p.carType,
            price: p.price,
            posServiceId: p.posServiceId,
          })),
        },
      },
      include: {
        subscriptionServices: {
          include: {
            service: true,
          },
        },
        subscriptionPrices: true,
      },
    });

    return this.formatSubscriptionResponse(subscription);
  }

  async findAll() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { isActive: true },
      include: {
        subscriptionServices: {
          include: {
            service: true,
          },
        },
        subscriptionPrices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((sub) => this.formatSubscriptionResponse(sub));
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        subscriptionServices: {
          include: {
            service: true,
          },
        },
        subscriptionPrices: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.formatSubscriptionResponse(subscription);
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    const { name, description, endDate, maxUsesPerService, services, prices } =
      updateSubscriptionDto;

    // Validate services exist
    const serviceIds = services.map((s) => s.serviceId);
    const existingServices = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    if (existingServices.length !== serviceIds.length) {
      throw new BadRequestException('One or more services do not exist');
    }

    // Validate pricing for all car types
    const requiredCarTypes = Object.values(CarType);
    const providedCarTypes = prices.map((p) => p.carType);
    const missingCarTypes = requiredCarTypes.filter(
      (ct) => !providedCarTypes.includes(ct),
    );

    if (missingCarTypes.length > 0) {
      throw new BadRequestException(
        `Missing pricing for car types: ${missingCarTypes.join(', ')}`,
      );
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        name,
        description,
        endDate: endDate ? new Date(endDate) : null,
        maxUsesPerService,
        subscriptionServices: {
          deleteMany: {},
          create: services.map((s) => ({
            serviceId: s.serviceId,
            usageCount: s.usageCount,
          })),
        },
        subscriptionPrices: {
          deleteMany: {},
          create: prices.map((p) => ({
            carType: p.carType,
            price: p.price,
            posServiceId: p.posServiceId,
          })),
        },
      },
      include: {
        subscriptionServices: {
          include: {
            service: true,
          },
        },
        subscriptionPrices: true,
      },
    });

    return this.formatSubscriptionResponse(subscription);
  }

  async delete(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Subscription deleted successfully' };
  }

  async purchaseSubscription(purchaseDto: PurchaseSubscriptionDto) {
    const { customerId, carId, subscriptionId } = purchaseDto;

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate car exists and belongs to customer
    const car = await this.prisma.car.findFirst({
      where: {
        id: carId,
        customerId,
      },
      include: {
        model: true,
      },
    });
    if (!car) {
      throw new NotFoundException(
        'Car not found or does not belong to customer',
      );
    }

    // Validate subscription exists and is active
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId, isActive: true },
      include: {
        subscriptionPrices: true,
        subscriptionServices: {
          include: {
            service: true,
          },
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found or inactive');
    }

    // Get pricing for car type
    const carType = car.model.type;
    const priceInfo = subscription.subscriptionPrices.find(
      (p) => p.carType === carType,
    );
    if (!priceInfo) {
      throw new BadRequestException(
        `No pricing available for car type: ${carType}`,
      );
    }

    // Check if subscription has expired
    if (subscription.endDate && subscription.endDate < new Date()) {
      throw new BadRequestException('Subscription has expired');
    }

    // Calculate expiry date as 30 days from purchase
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Create customer subscription (without QR activation yet)
    const customerSubscription = await this.prisma.customerSubscription.create({
      data: {
        customerId,
        carId,
        subscriptionId,
        qrCodeId: null, // Will be set during activation
        totalPrice: priceInfo.price,
        expiryDate,
      },
      include: {
        customer: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        subscription: {
          include: {
            subscriptionServices: {
              include: {
                service: true,
              },
            },
            subscriptionPrices: true,
          },
        },
      },
    });

    // Create POS order for subscription purchase
    try {
      await this.integrationService.createOrderFromSubscription(
        customerSubscription.id,
        false,
      );
    } catch (error) {
      console.error(
        'Failed to create POS order for subscription purchase:',
        error,
      );
      // Don't fail the subscription purchase if POS integration fails
    }

    // Send SMS for subscription purchase
    if (
      customerSubscription.customer.mobileNumber.startsWith('077') ||
      customerSubscription.customer.mobileNumber.startsWith('078')
    ) {
      const subscriptionWelcomeMessage = `Welcom to ${customerSubscription.subscription.name} Subscription! Your journy to consistant car care begins here. We look forward to keeping your car Neat and Radiant.`;
      await this.sendSMS(
        customerSubscription.customer.mobileNumber,
        subscriptionWelcomeMessage,
      );
    }

    return {
      id: customerSubscription.id,
      customerId: customerSubscription.customerId,
      carId: customerSubscription.carId,
      subscriptionId: customerSubscription.subscriptionId,
      totalPrice: customerSubscription.totalPrice,
      purchaseDate: customerSubscription.purchaseDate,
      subscription: this.formatSubscriptionResponse(
        customerSubscription.subscription,
      ),
      customer: {
        name: `${customerSubscription.customer.fName} ${customerSubscription.customer.lName}`,
        mobileNumber: customerSubscription.customer.mobileNumber,
      },
      car: {
        plateNumber: customerSubscription.car.plateNumber,
        brand: customerSubscription.car.brand.name,
        model: customerSubscription.car.model.name,
        type: customerSubscription.car.model.type,
      },
      status: 'purchased', // Not yet activated with QR
    };
  }

  async activateSubscription(activateDto: ActivateSubscriptionDto) {
    const { customerSubscriptionId, qrCodeId } = activateDto;

    // Check if customer subscription exists and is not already activated
    const customerSubscription =
      await this.prisma.customerSubscription.findUnique({
        where: { id: customerSubscriptionId },
        include: {
          customer: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          subscription: true,
        },
      });

    if (!customerSubscription) {
      throw new NotFoundException('Customer subscription not found');
    }

    if (customerSubscription.activationDate) {
      throw new BadRequestException('Subscription is already activated');
    }

    // Check if subscription has expired
    if (
      customerSubscription.expiryDate &&
      customerSubscription.expiryDate < new Date()
    ) {
      throw new BadRequestException('Cannot activate expired subscription');
    }

    // Check if QR code exists and is not already used
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        customerSubscriptions: {
          where: {
            isActive: true,
            qrCodeId: qrCodeId,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR Code not found');
    }

    if (qrCode.isActive && qrCode.customerSubscriptions.length > 0) {
      throw new ConflictException(
        'QR Code is already in use by another subscription',
      );
    }

    // Activate the subscription
    const activatedSubscription = await this.prisma.customerSubscription.update(
      {
        where: { id: customerSubscriptionId },
        data: {
          qrCodeId,
          activationDate: new Date(),
        },
        include: {
          qrCode: true,
          subscription: {
            include: {
              subscriptionServices: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      },
    );

    // Update QR code status
    await this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: { isActive: true },
    });

    return {
      message: 'Subscription activated successfully',
      customerSubscriptionId: activatedSubscription.id,
      qrCode: activatedSubscription.qrCode!.code,
      activationDate: activatedSubscription.activationDate,
      customer: {
        name: `${customerSubscription.customer.fName} ${customerSubscription.customer.lName}`,
        mobileNumber: customerSubscription.customer.mobileNumber,
      },
      car: {
        plateNumber: customerSubscription.car.plateNumber,
        brand: customerSubscription.car.brand.name,
        model: customerSubscription.car.model.name,
      },
      subscription: {
        name: customerSubscription.subscription.name,
        services: activatedSubscription.subscription.subscriptionServices.map(
          (ss) => ({
            serviceName: ss.service.name,
            usageCount: ss.usageCount,
          }),
        ),
      },
    };
  }

  async assignQrCode(assignDto: AssignQRCodeDto) {
    const { customerSubscriptionId, qrCodeId } = assignDto;

    // Check if customer subscription exists
    const customerSubscription =
      await this.prisma.customerSubscription.findUnique({
        where: { id: customerSubscriptionId },
        include: {
          customer: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          subscription: true,
        },
      });

    if (!customerSubscription) {
      throw new NotFoundException('Customer subscription not found');
    }

    // Check if subscription has expired
    if (
      customerSubscription.expiryDate &&
      customerSubscription.expiryDate < new Date()
    ) {
      throw new BadRequestException(
        'Cannot assign QR code to expired subscription',
      );
    }

    // Check if QR code exists and is not already used
    const qrCode = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
      include: {
        customerSubscriptions: {
          where: {
            isActive: true,
            qrCodeId: qrCodeId,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('QR Code not found');
    }

    if (qrCode.isActive && qrCode.customerSubscriptions.length > 0) {
      throw new ConflictException(
        'QR Code is already in use by another subscription',
      );
    }

    // Assign the QR code to the subscription
    const updatedSubscription = await this.prisma.customerSubscription.update({
      where: { id: customerSubscriptionId },
      data: {
        qrCodeId,
        activationDate: new Date(), // Auto-activate when QR is assigned
      },
      include: {
        qrCode: true,
        subscription: {
          include: {
            subscriptionServices: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    // Update QR code status
    await this.prisma.qRCode.update({
      where: { id: qrCodeId },
      data: { isActive: true },
    });

    return {
      message: 'QR code assigned and subscription activated successfully',
      customerSubscriptionId: updatedSubscription.id,
      qrCode: updatedSubscription.qrCode!.code,
      activationDate: updatedSubscription.activationDate,
      customer: {
        name: `${customerSubscription.customer.fName} ${customerSubscription.customer.lName}`,
        mobileNumber: customerSubscription.customer.mobileNumber,
      },
      car: {
        plateNumber: customerSubscription.car.plateNumber,
        brand: customerSubscription.car.brand.name,
        model: customerSubscription.car.model.name,
      },
      subscription: {
        name: customerSubscription.subscription.name,
        services: updatedSubscription.subscription.subscriptionServices.map(
          (ss) => ({
            serviceName: ss.service.name,
            usageCount: ss.usageCount,
          }),
        ),
      },
    };
  }

  async getSubscriptionByQR(qrCodeId: string) {
    const qr = await this.prisma.qRCode.findUnique({
      where: { id: qrCodeId },
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
              include: {
                subscriptionServices: {
                  include: {
                    service: true,
                  },
                },
              },
            },
            usageRecords: {
              include: {
                service: true,
                usedBy: true,
              },
              orderBy: {
                usedAt: 'desc',
              },
            },
          },
        },
      },
    });

    if (!qr || qr.customerSubscriptions.length === 0) {
      throw new NotFoundException(
        'No active subscription found for this QR code',
      );
    }

    const customerSubscription = qr.customerSubscriptions[0];

    // Calculate remaining services with detailed usage information
    const remainingServices =
      customerSubscription.subscription.subscriptionServices.map(
        (subService) => {
          const serviceUsages = customerSubscription.usageRecords.filter(
            (record) => record.serviceId === subService.serviceId,
          );

          const usedCount = serviceUsages.length;
          const remainingCount = Math.max(0, subService.usageCount - usedCount);

          return {
            serviceId: subService.serviceId,
            serviceName: subService.service.name,
            remainingCount,
            totalCount: subService.usageCount,
            usedCount,
            lastUsed: serviceUsages.length > 0 ? serviceUsages[0].usedAt : null,
            usageHistory: serviceUsages.map((usage) => ({
              usedAt: usage.usedAt,
              usedBy: usage.usedBy
                ? {
                    id: usage.usedBy.id,
                    name: usage.usedBy.name,
                  }
                : null,
              notes: usage.notes,
            })),
          };
        },
      );

    return {
      id: customerSubscription.id,
      qrCode: qr.code,
      customer: {
        id: customerSubscription.customer.id,
        firstName: customerSubscription.customer.fName,
        lastName: customerSubscription.customer.lName,
        fullName: `${customerSubscription.customer.fName} ${customerSubscription.customer.lName}`,
        mobileNumber: customerSubscription.customer.mobileNumber,
        isActive: customerSubscription.customer.isActive,
        isBlacklisted: customerSubscription.customer.isBlacklisted,
        customerSince: customerSubscription.customer.createdAt,
      },
      car: {
        id: customerSubscription.car.id,
        plateNumber: customerSubscription.car.plateNumber,
        brand: {
          id: customerSubscription.car.brand.id,
          name: customerSubscription.car.brand.name,
          logoUrl: customerSubscription.car.brand.logoUrl,
        },
        model: {
          id: customerSubscription.car.model.id,
          name: customerSubscription.car.model.name,
          type: customerSubscription.car.model.type,
        },
        year: customerSubscription.car.year,
        color: customerSubscription.car.color,
        registrationDate: customerSubscription.car.createdAt,
      },
      subscription: {
        id: customerSubscription.subscription.id,
        name: customerSubscription.subscription.name,
        description: customerSubscription.subscription.description,
        endDate: customerSubscription.subscription.endDate,
        maxUsesPerService: customerSubscription.subscription.maxUsesPerService,
      },
      remainingServices,
      totalServicesAvailable: remainingServices.length,
      totalServicesUsed: customerSubscription.usageRecords.length,
      totalServicesRemaining: remainingServices.reduce(
        (sum, service) => sum + service.remainingCount,
        0,
      ),
      subscriptionStatus: {
        isActive: customerSubscription.isActive,
        totalPrice: customerSubscription.totalPrice,
        purchaseDate: customerSubscription.purchaseDate,
        activationDate: customerSubscription.activationDate,
        expiryDate: customerSubscription.expiryDate,
        isExpired: customerSubscription.expiryDate
          ? new Date() > customerSubscription.expiryDate
          : false,
        daysUntilExpiry: customerSubscription.expiryDate
          ? Math.ceil(
              (customerSubscription.expiryDate.getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
      },
    };
  }

  async useService(useServiceDto: UseServiceDto) {
    const { qrCode, serviceId, usedById, notes } = useServiceDto;

    // Validate user exists if provided
    if (usedById) {
      const user = await this.prisma.user.findUnique({
        where: { id: usedById },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Get subscription by QR code
    const subscriptionInfo = await this.getSubscriptionByQR(qrCode);

    // Check if subscription is active and not expired
    if (!subscriptionInfo.subscriptionStatus.isActive) {
      throw new BadRequestException('Subscription is not active');
    }

    if (subscriptionInfo.subscriptionStatus.isExpired) {
      throw new BadRequestException('Subscription has expired');
    }

    if (!subscriptionInfo.subscriptionStatus.activationDate) {
      throw new BadRequestException('Subscription is not activated yet');
    }

    // Check if service is available in subscription
    const availableService = subscriptionInfo.remainingServices.find(
      (service) => service.serviceId === serviceId,
    );

    if (!availableService) {
      throw new BadRequestException(
        'Service not available in this subscription package',
      );
    }

    if (availableService.remainingCount <= 0) {
      throw new BadRequestException(
        `No remaining uses for service "${availableService.serviceName}". Used ${availableService.usedCount}/${availableService.totalCount} times.`,
      );
    }

    // Validate service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Record service usage and create transaction in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Record service usage
      const usageRecord = await prisma.subscriptionUsageRecord.create({
        data: {
          customerSubscriptionId: subscriptionInfo.id,
          serviceId,
          usedById,
          notes,
        },
        include: {
          service: true,
          usedBy: true,
        },
      });

      // Create a scheduled transaction for the service usage
      const transaction = await prisma.transaction.create({
        data: {
          status: TransactionStatus.scheduled,
          isPaid: true, // Subscription services are pre-paid
          isPulled: false, // Not yet pulled, needs to be processed
          isSubscription: true, // Mark as subscription transaction
          customerId: subscriptionInfo.customer.id,
          carId: subscriptionInfo.car.id,
          serviceId,
          createdByUserId: usedById,
          notes:
            notes ||
            `Service used via subscription: ${subscriptionInfo.subscription.name}`,
          deliverTime: null, // Will be set when transaction is completed
        },
        include: {
          customer: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          service: true,
          createdByUser: true,
        },
      });

      return { usageRecord, transaction };
    });

    // Send SMS for service usage
    if (
      subscriptionInfo.customer.mobileNumber.startsWith('077') ||
      subscriptionInfo.customer.mobileNumber.startsWith('078')
    ) {
      const newRemainingCount = availableService.remainingCount - 1;
      const serviceUsageMessage = `Dear ${
        subscriptionInfo.customer.firstName
      } ${
        subscriptionInfo.customer.lastName
      }, You car will be Ready and Radiant in no time. You have ${newRemainingCount} ${
        newRemainingCount === 1 ? 'service' : 'services'
      } remaining in your subscription.`;
      await this.sendSMS(
        subscriptionInfo.customer.mobileNumber,
        serviceUsageMessage,
      );
    }

    return {
      message: 'Service used successfully and scheduled transaction created',
      serviceUsed: result.usageRecord.service.name,
      previousRemaining: availableService.remainingCount,
      newRemaining: availableService.remainingCount - 1,
      usedAt: result.usageRecord.usedAt,
      usedBy: result.usageRecord.usedBy?.name || 'Unknown',
      customer: {
        name: subscriptionInfo.customer.fullName,
        mobileNumber: subscriptionInfo.customer.mobileNumber,
      },
      car: {
        plateNumber: subscriptionInfo.car.plateNumber,
        brand: subscriptionInfo.car.brand.name,
        model: subscriptionInfo.car.model.name,
      },
      totalServicesRemaining: subscriptionInfo.totalServicesRemaining - 1,
      transaction: {
        id: result.transaction.id,
        status: result.transaction.status,
        createdAt: result.transaction.createdAt,
        isSubscription: result.transaction.isSubscription,
        service: result.transaction.service.name,
      },
    };
  }

  async getAllCustomerSubscriptions() {
    const allCustomerSubscriptions =
      await this.prisma.customerSubscription.findMany({
        where: {
          isActive: true,
        },
        include: {
          customer: true,
          qrCode: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          subscription: {
            include: {
              subscriptionServices: {
                include: {
                  service: true,
                },
              },
            },
          },
          usageRecords: {
            include: {
              service: true,
              usedBy: true,
            },
            orderBy: {
              usedAt: 'desc',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    return allCustomerSubscriptions.map((customerSub) => {
      const remainingServices =
        customerSub.subscription.subscriptionServices.map((subService) => {
          const serviceUsages = customerSub.usageRecords.filter(
            (record) => record.serviceId === subService.serviceId,
          );
          const usedCount = serviceUsages.length;

          return {
            serviceId: subService.serviceId,
            serviceName: subService.service.name,
            remainingCount: Math.max(0, subService.usageCount - usedCount),
            totalCount: subService.usageCount,
            usedCount,
            lastUsed: serviceUsages.length > 0 ? serviceUsages[0].usedAt : null,
          };
        });

      const totalServicesRemaining = remainingServices.reduce(
        (sum, service) => sum + service.remainingCount,
        0,
      );
      const isExpired = customerSub.expiryDate
        ? new Date() > customerSub.expiryDate
        : false;

      return {
        id: customerSub.id,
        qrCode: customerSub.qrCode?.code || null,
        isActivated: customerSub.activationDate !== null,
        customer: {
          id: customerSub.customer.id,
          firstName: customerSub.customer.fName,
          lastName: customerSub.customer.lName,
          fullName: `${customerSub.customer.fName} ${customerSub.customer.lName}`,
          mobileNumber: customerSub.customer.mobileNumber,
          isActive: customerSub.customer.isActive,
          isBlacklisted: customerSub.customer.isBlacklisted,
        },
        subscription: {
          id: customerSub.subscription.id,
          name: customerSub.subscription.name,
          description: customerSub.subscription.description,
        },
        car: {
          id: customerSub.car.id,
          plateNumber: customerSub.car.plateNumber,
          brand: {
            id: customerSub.car.brand.id,
            name: customerSub.car.brand.name,
          },
          model: {
            id: customerSub.car.model.id,
            name: customerSub.car.model.name,
            type: customerSub.car.model.type,
          },
          year: customerSub.car.year,
          color: customerSub.car.color,
        },
        remainingServices,
        totalServicesRemaining,
        status: {
          isActive: customerSub.isActive,
          isActivated: customerSub.activationDate !== null,
          isExpired,
          canUseServices:
            customerSub.activationDate !== null &&
            !isExpired &&
            totalServicesRemaining > 0,
        },
        pricing: {
          totalPrice: customerSub.totalPrice,
        },
        dates: {
          purchaseDate: customerSub.purchaseDate,
          activationDate: customerSub.activationDate,
          expiryDate: customerSub.expiryDate,
          daysUntilExpiry: customerSub.expiryDate
            ? Math.ceil(
                (customerSub.expiryDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null,
        },
      };
    });
  }

  async getPendingActivations() {
    const pendingSubscriptions =
      await this.prisma.customerSubscription.findMany({
        where: {
          isActive: true,
          activationDate: null,
        },
        include: {
          customer: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          subscription: {
            include: {
              subscriptionServices: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    return pendingSubscriptions.map((customerSub) => ({
      id: customerSub.id,
      customer: {
        id: customerSub.customer.id,
        name: `${customerSub.customer.fName} ${customerSub.customer.lName}`,
        mobileNumber: customerSub.customer.mobileNumber,
      },
      car: {
        id: customerSub.car.id,
        plateNumber: customerSub.car.plateNumber,
        brand: customerSub.car.brand.name,
        model: customerSub.car.model.name,
        type: customerSub.car.model.type,
      },
      subscription: {
        id: customerSub.subscription.id,
        name: customerSub.subscription.name,
        description: customerSub.subscription.description,
        services: customerSub.subscription.subscriptionServices.map((ss) => ({
          serviceName: ss.service.name,
          usageCount: ss.usageCount,
        })),
      },
      totalPrice: customerSub.totalPrice,
      purchaseDate: customerSub.purchaseDate,
      expiryDate: customerSub.expiryDate,
    }));
  }

  async getCustomerSubscriptions(customerId: string) {
    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const subscriptions = await this.prisma.customerSubscription.findMany({
      where: {
        customerId,
        isActive: true,
      },
      include: {
        qrCode: true,
        subscription: {
          include: {
            subscriptionServices: {
              include: {
                service: true,
              },
            },
          },
        },
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        usageRecords: {
          include: {
            service: true,
            usedBy: true,
          },
          orderBy: {
            usedAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((customerSub) => {
      const remainingServices =
        customerSub.subscription.subscriptionServices.map((subService) => {
          const serviceUsages = customerSub.usageRecords.filter(
            (record) => record.serviceId === subService.serviceId,
          );
          const usedCount = serviceUsages.length;

          return {
            serviceId: subService.serviceId,
            serviceName: subService.service.name,
            remainingCount: Math.max(0, subService.usageCount - usedCount),
            totalCount: subService.usageCount,
            usedCount,
            lastUsed: serviceUsages.length > 0 ? serviceUsages[0].usedAt : null,
          };
        });

      const totalServicesRemaining = remainingServices.reduce(
        (sum, service) => sum + service.remainingCount,
        0,
      );
      const isExpired = customerSub.expiryDate
        ? new Date() > customerSub.expiryDate
        : false;

      return {
        id: customerSub.id,
        qrCode: customerSub.qrCode?.code || null,
        isActivated: customerSub.activationDate !== null,
        subscription: {
          id: customerSub.subscription.id,
          name: customerSub.subscription.name,
          description: customerSub.subscription.description,
        },
        car: {
          id: customerSub.car.id,
          plateNumber: customerSub.car.plateNumber,
          brand: {
            id: customerSub.car.brand.id,
            name: customerSub.car.brand.name,
          },
          model: {
            id: customerSub.car.model.id,
            name: customerSub.car.model.name,
            type: customerSub.car.model.type,
          },
          year: customerSub.car.year,
          color: customerSub.car.color,
        },
        remainingServices,
        totalServicesRemaining,
        status: {
          isActive: customerSub.isActive,
          isActivated: customerSub.activationDate !== null,
          isExpired,
          canUseServices:
            customerSub.activationDate !== null &&
            !isExpired &&
            totalServicesRemaining > 0,
        },
        pricing: {
          totalPrice: customerSub.totalPrice,
        },
        dates: {
          purchaseDate: customerSub.purchaseDate,
          activationDate: customerSub.activationDate,
          expiryDate: customerSub.expiryDate,
          daysUntilExpiry: customerSub.expiryDate
            ? Math.ceil(
                (customerSub.expiryDate.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null,
        },
      };
    });
  }

  async renewSubscription(qrCodeId: string) {
    const sub = await this.prisma.customerSubscription.findUnique({
      where: {
        qrCodeId,
      },
      include: {
        customer: true,
        car: {
          include: {
            brand: true,
            model: true,
          },
        },
        subscription: true,
      },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found for this QR code');
    }

    if (!sub.isActive) {
      throw new BadRequestException('Subscription is not active');
    }

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    const result = await this.prisma.$transaction(async (prisma) => {
      await prisma.subscriptionUsageRecord.deleteMany({
        where: {
          customerSubscriptionId: sub.id,
        },
      });

      const updatedSubscription = await prisma.customerSubscription.update({
        where: { id: sub.id },
        data: {
          expiryDate: newExpiryDate,
        },
        include: {
          customer: true,
          car: {
            include: {
              brand: true,
              model: true,
            },
          },
          subscription: {
            include: {
              subscriptionServices: {
                include: {
                  service: true,
                },
              },
            },
          },
          qrCode: true,
        },
      });

      return updatedSubscription;
    });

    // Create POS order for subscription renewal
    try {
      await this.integrationService.createOrderFromSubscription(
        result.id,
        true,
      );
    } catch (error) {
      console.error(
        'Failed to create POS order for subscription renewal:',
        error,
      );
      // Don't fail the renewal if POS integration fails
    }

    // Send SMS for subscription renewal
    if (
      result.customer.mobileNumber.startsWith('077') ||
      result.customer.mobileNumber.startsWith('078')
    ) {
      const renewalMessage = `Your ${result.subscription.name} subscription has been renewed successfully! Your services are reset and ready to use. Thank you for choosing RADIANT!`;
      await this.sendSMS(result.customer.mobileNumber, renewalMessage);
    }

    return {
      message: 'Subscription renewed successfully',
      id: result.id,
      qrCode: result.qrCode?.code,
      customer: {
        name: `${result.customer.fName} ${result.customer.lName}`,
        mobileNumber: result.customer.mobileNumber,
      },
      car: {
        plateNumber: result.car.plateNumber,
        brand: result.car.brand.name,
        model: result.car.model.name,
      },
      subscription: {
        name: result.subscription.name,
        services: result.subscription.subscriptionServices.map((ss) => ({
          serviceName: ss.service.name,
          usageCount: ss.usageCount,
        })),
      },
      renewedAt: new Date(),
      newExpiryDate,
      usageRecordsReset: true,
    };
  }

  private formatSubscriptionResponse(subscription: any) {
    return {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      endDate: subscription.endDate,
      maxUsesPerService: subscription.maxUsesPerService,
      isActive: subscription.isActive,
      services: subscription.subscriptionServices.map((ss: any) => ({
        id: ss.id,
        serviceId: ss.serviceId,
        serviceName: ss.service.name,
        usageCount: ss.usageCount,
      })),
      prices: subscription.subscriptionPrices.map((sp: any) => ({
        carType: sp.carType,
        price: sp.price,
        posServiceId: sp.posServiceId,
      })),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
