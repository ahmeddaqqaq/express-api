import { PrismaClient, CarType } from '@prisma/client';

const prisma = new PrismaClient();

async function testCompleteSubscriptionFlow() {
  console.log('🧪 Starting comprehensive subscription system test...');

  try {
    // Step 1: Check if we have necessary data
    console.log('\n📋 Step 1: Checking existing data...');
    
    const services = await prisma.service.findMany();
    const customers = await prisma.customer.findMany({ take: 1 });
    const cars = await prisma.car.findMany({ take: 1, include: { model: true } });
    
    if (services.length < 2) {
      console.log('❌ Need at least 2 services to test. Found:', services.length);
      return;
    }
    
    if (customers.length === 0) {
      console.log('❌ Need at least 1 customer to test. Found:', customers.length);
      return;
    }
    
    if (cars.length === 0) {
      console.log('❌ Need at least 1 car to test. Found:', cars.length);
      return;
    }
    
    console.log('✅ Found sufficient data:');
    console.log(`   - Services: ${services.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Cars: ${cars.length}`);

    // Step 2: Create a subscription template
    console.log('\n🏗️ Step 2: Creating subscription template...');
    
    const subscription = await prisma.subscription.create({
      data: {
        name: 'Test Premium Package',
        description: 'A comprehensive test package',
        subscriptionServices: {
          create: [
            {
              serviceId: services[0].id,
              usageCount: 3,
            },
            {
              serviceId: services[1].id,
              usageCount: 2,
            },
          ],
        },
        subscriptionPrices: {
          create: [
            { carType: CarType.Sedan, price: 100 },
            { carType: CarType.SUV, price: 150 },
            { carType: CarType.VAN, price: 200 },
            { carType: CarType.Crossover, price: 120 },
            { carType: CarType.Bike, price: 50 },
          ],
        },
      },
      include: {
        subscriptionServices: { include: { service: true } },
        subscriptionPrices: true,
      },
    });
    
    console.log('✅ Created subscription template:', subscription.name);
    console.log(`   - Services: ${subscription.subscriptionServices.length}`);
    console.log(`   - Pricing tiers: ${subscription.subscriptionPrices.length}`);

    // Step 3: Generate QR codes
    console.log('\n🏷️ Step 3: Generating QR codes...');
    
    const qrCode = await prisma.qRCode.create({
      data: {
        code: 'TEST' + Math.random().toString(36).substring(2, 14).toUpperCase(),
      },
    });
    
    console.log('✅ Generated QR code:', qrCode.code);

    // Step 4: Purchase subscription
    console.log('\n💳 Step 4: Purchasing subscription...');
    
    const customerSubscription = await prisma.customerSubscription.create({
      data: {
        customerId: customers[0].id,
        carId: cars[0].id,
        subscriptionId: subscription.id,
        qrCodeId: null, // Not activated yet
        totalPrice: subscription.subscriptionPrices.find(p => p.carType === cars[0].model.type)?.price || 100,
      },
    });
    
    console.log('✅ Purchased subscription for customer');
    console.log(`   - Customer: ${customers[0].fName} ${customers[0].lName}`);
    console.log(`   - Car: ${cars[0].plateNumber}`);
    console.log(`   - Price: $${customerSubscription.totalPrice}`);

    // Step 5: Activate subscription with QR code
    console.log('\n🔓 Step 5: Activating subscription...');
    
    const activatedSubscription = await prisma.customerSubscription.update({
      where: { id: customerSubscription.id },
      data: {
        qrCodeId: qrCode.id,
        activationDate: new Date(),
      },
    });
    
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: { isActive: true },
    });
    
    console.log('✅ Activated subscription with QR code');

    // Step 6: Test QR code lookup
    console.log('\n🔍 Step 6: Testing QR code lookup...');
    
    const qrLookup = await prisma.qRCode.findUnique({
      where: { code: qrCode.code },
      include: {
        customerSubscriptions: {
          where: { isActive: true },
          include: {
            customer: true,
            car: { include: { brand: true, model: true } },
            subscription: {
              include: {
                subscriptionServices: { include: { service: true } },
              },
            },
            usageRecords: { include: { service: true } },
          },
        },
      },
    });
    
    if (qrLookup && qrLookup.customerSubscriptions.length > 0) {
      const custSub = qrLookup.customerSubscriptions[0];
      console.log('✅ QR code lookup successful:');
      console.log(`   - Customer: ${custSub.customer.fName} ${custSub.customer.lName}`);
      console.log(`   - Car: ${custSub.car.plateNumber} (${custSub.car.brand.name} ${custSub.car.model.name})`);
      console.log(`   - Subscription: ${custSub.subscription.name}`);
      console.log(`   - Services available: ${custSub.subscription.subscriptionServices.length}`);
    }

    // Step 7: Use a service
    console.log('\n🔧 Step 7: Using a service...');
    
    const serviceUsage = await prisma.subscriptionUsageRecord.create({
      data: {
        customerSubscriptionId: activatedSubscription.id,
        serviceId: services[0].id,
        notes: 'Test service usage',
      },
      include: {
        service: true,
      },
    });
    
    console.log('✅ Service used successfully:');
    console.log(`   - Service: ${serviceUsage.service.name}`);
    console.log(`   - Used at: ${serviceUsage.usedAt}`);

    // Step 8: Check remaining services
    console.log('\n📊 Step 8: Checking remaining services...');
    
    const remainingCheck = await prisma.customerSubscription.findUnique({
      where: { id: activatedSubscription.id },
      include: {
        subscription: {
          include: {
            subscriptionServices: { include: { service: true } },
          },
        },
        usageRecords: { include: { service: true } },
      },
    });
    
    if (remainingCheck) {
      console.log('✅ Remaining services calculated:');
      remainingCheck.subscription.subscriptionServices.forEach(subService => {
        const used = remainingCheck.usageRecords.filter(ur => ur.serviceId === subService.serviceId).length;
        const remaining = Math.max(0, subService.usageCount - used);
        console.log(`   - ${subService.service.name}: ${remaining}/${subService.usageCount} remaining`);
      });
    }

    // Step 9: Cleanup
    console.log('\n🧹 Step 9: Cleaning up test data...');
    
    await prisma.subscriptionUsageRecord.deleteMany({
      where: { customerSubscriptionId: activatedSubscription.id },
    });
    
    await prisma.customerSubscription.delete({
      where: { id: activatedSubscription.id },
    });
    
    await prisma.qRCode.delete({
      where: { id: qrCode.id },
    });
    
    await prisma.subscription.delete({
      where: { id: subscription.id },
    });
    
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All subscription system tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test key database relationships
async function testDatabaseRelationships() {
  console.log('\n🔗 Testing database relationships...');
  
  try {
    // Test cascading deletes and constraints
    const tempSubscription = await prisma.subscription.create({
      data: {
        name: 'Cascade Test Subscription',
        subscriptionServices: {
          create: [
            {
              service: { connect: { id: (await prisma.service.findFirst())!.id } },
              usageCount: 1,
            },
          ],
        },
        subscriptionPrices: {
          create: [
            { carType: CarType.Sedan, price: 50 },
            { carType: CarType.SUV, price: 75 },
            { carType: CarType.VAN, price: 100 },
            { carType: CarType.Crossover, price: 60 },
            { carType: CarType.Bike, price: 25 },
          ],
        },
      },
    });
    
    console.log('✅ Created subscription with related data');
    
    // Delete the subscription - should cascade to related records
    await prisma.subscription.delete({
      where: { id: tempSubscription.id },
    });
    
    // Verify cascading worked
    const orphanedServices = await prisma.subscriptionService.findMany({
      where: { subscriptionId: tempSubscription.id },
    });
    
    const orphanedPrices = await prisma.subscriptionPrice.findMany({
      where: { subscriptionId: tempSubscription.id },
    });
    
    if (orphanedServices.length === 0 && orphanedPrices.length === 0) {
      console.log('✅ Cascade delete working correctly');
    } else {
      console.log('❌ Cascade delete failed - found orphaned records');
    }
    
  } catch (error) {
    console.error('❌ Relationship test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  await testCompleteSubscriptionFlow();
  await testDatabaseRelationships();
}

runAllTests();