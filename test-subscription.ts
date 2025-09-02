import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSubscriptionSystem() {
  try {
    console.log('Testing subscription system...');

    // Check if we can create a simple subscription
    const services = await prisma.service.findMany({
      take: 2,
    });

    if (services.length < 2) {
      console.log('Not enough services found. Need at least 2 services to test.');
      return;
    }

    console.log('Found services:', services.map(s => s.name));

    // Try to create a test subscription
    const testSubscription = await prisma.subscription.create({
      data: {
        name: 'Test Subscription',
        description: 'A test subscription package',
        subscriptionServices: {
          create: services.map(service => ({
            serviceId: service.id,
            usageCount: 3,
          })),
        },
        subscriptionPrices: {
          create: [
            { carType: 'Sedan', price: 100 },
            { carType: 'SUV', price: 150 },
            { carType: 'VAN', price: 200 },
            { carType: 'Crossover', price: 120 },
            { carType: 'Bike', price: 50 },
          ],
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

    console.log('✅ Created test subscription:', testSubscription.name);
    console.log('Services included:', testSubscription.subscriptionServices.length);
    console.log('Price tiers:', testSubscription.subscriptionPrices.length);

    // Generate a test QR code
    const qrCode = await prisma.qRCode.create({
      data: {
        code: 'TEST' + Math.random().toString(36).substring(2, 14).toUpperCase(),
      },
    });

    console.log('✅ Generated test QR code:', qrCode.code);

    // Clean up
    await prisma.subscription.delete({
      where: { id: testSubscription.id },
    });

    await prisma.qRCode.delete({
      where: { id: qrCode.id },
    });

    console.log('✅ Cleaned up test data');
    console.log('🎉 Subscription system test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionSystem();