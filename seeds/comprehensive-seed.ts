import { PrismaClient, CarType } from '@prisma/client';
import customers from './customers_data';
import { carsData } from './cars-seed-data';

const prisma = new PrismaClient();

// Brand data from backup
const brands = [
  { name: "Test Car" },
  { name: "Abarth" },
  { name: "Acura" },
  { name: "Alfa Romeo" },
  { name: "Aston Martin" },
  { name: "Audi" },
  { name: "Bentley" },
  { name: "Bestune" },
  { name: "BMW" },
  { name: "Borgward" },
  { name: "Brilliance" },
  { name: "Bugatti" },
  { name: "Buick" },
  { name: "BYD" },
  { name: "Cadillac" },
  { name: "Changan" },
  { name: "Chery" },
  { name: "Chevrolet" },
  { name: "Chrysler" },
  { name: "Citroen" },
  { name: "CMC" },
  { name: "Daewoo" },
  { name: "Daihatsu" },
  { name: "Dayun" },
  { name: "Dodge" },
  { name: "Dongfeng" },
  { name: "Dorcen" },
  { name: "Ferrari" },
  { name: "Fiat" },
  { name: "Fisker" },
  { name: "Force" },
  { name: "Ford" },
  { name: "Foton" },
  { name: "GAC" },
  { name: "Geely" },
  { name: "GMC" },
  { name: "Great Wall" },
  { name: "Hafei" },
  { name: "Haval" },
  { name: "Hawtai" },
  { name: "Honda" },
  { name: "Hongqi" },
  { name: "Hummer" },
  { name: "Hunaghai" },
  { name: "Hyundai" },
  { name: "Infiniti" },
  { name: "Iran Khodro" },
  { name: "Isuzu" },
  { name: "JAC" },
  { name: "Jaguar" },
  { name: "Jeep" },
  { name: "Jetour" },
  { name: "Jinbei" },
  { name: "JMC" },
  { name: "Kaiyi" },
  { name: "Kia" },
  { name: "Lada" },
  { name: "Lamborghini" },
  { name: "Lancia" },
  { name: "Land Rover" },
  { name: "Lexus" },
  { name: "Lifan" },
  { name: "Lincoln" },
  { name: "Lotus" },
  { name: "Mahindra" },
  { name: "Maserati" },
  { name: "Maxus" },
  { name: "Mazda" },
  { name: "McLaren" },
  { name: "Mercedes-Benz" },
  { name: "Mercury" },
  { name: "MG" },
  { name: "MINI" },
  { name: "Mitsubishi" },
  { name: "Mitsuoka" },
  { name: "Morgan" },
  { name: "NETA" },
  { name: "Nissan" },
  { name: "Opel" },
  { name: "Sedan" },
  { name: "Crossover" },
  { name: "LCV" },
  { name: "Van" },
  { name: "MPV" },
  { name: "SUV" },
  { name: "Pagani" },
  { name: "Peugeot" },
  { name: "Polestar" },
  { name: "Pontiac" },
  { name: "Porsche" },
  { name: "Proton" },
  { name: "Renault" },
  { name: "Rolls Royce" },
  { name: "Rover" },
  { name: "Saab" },
  { name: "SAIPA" },
  { name: "Samsung" },
  { name: "Saturn" },
  { name: "Scion" },
  { name: "SEAT" },
  { name: "Skoda" },
  { name: "Skywell" },
  { name: "Smart" },
  { name: "Soueast" },
  { name: "SsangYong" },
  { name: "Subaru" },
  { name: "Suzuki" },
  { name: "TATA" },
  { name: "Tesla" },
  { name: "Toyota" },
  { name: "Volkswagen" },
  { name: "Volvo" },
  { name: "Zotye" },
  { name: "ZXAUTO" },
  { name: "JMEV" },
  { name: "Bike" },
  { name: "Diken" },
  { name: "Neta x" },
  { name: "Baic" }
];

// Customer data imported from extracted backup (8,042 customers)

// Models data with brand mappings
const modelsData = [
  // Test Car models
  { name: "Test", brandName: "Test Car", type: CarType.Sedan },
  
  // Abarth models
  { name: "500e", brandName: "Abarth", type: CarType.Sedan },
  { name: "595", brandName: "Abarth", type: CarType.Sedan },
  { name: "695", brandName: "Abarth", type: CarType.Sedan },
  
  // Acura models
  { name: "CL", brandName: "Acura", type: CarType.Sedan },
  { name: "NSX", brandName: "Acura", type: CarType.Sedan },
  { name: "RSX", brandName: "Acura", type: CarType.Sedan },
  { name: "ZDX", brandName: "Acura", type: CarType.Sedan },
  { name: "Legend", brandName: "Acura", type: CarType.Sedan },
  { name: "RL", brandName: "Acura", type: CarType.Sedan },
  { name: "RLX", brandName: "Acura", type: CarType.Sedan },
  { name: "ILX", brandName: "Acura", type: CarType.Sedan },
  { name: "Integra", brandName: "Acura", type: CarType.Sedan },
  { name: "TL", brandName: "Acura", type: CarType.Sedan },
  { name: "TLX", brandName: "Acura", type: CarType.Sedan },
  { name: "TSX", brandName: "Acura", type: CarType.Sedan },
  { name: "MDX", brandName: "Acura", type: CarType.SUV },
  { name: "RDX", brandName: "Acura", type: CarType.SUV },
  
  // BMW models
  { name: "1 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "2 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "3 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "4 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "5 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "6 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "7 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "8 Series", brandName: "BMW", type: CarType.Sedan },
  { name: "M2", brandName: "BMW", type: CarType.Sedan },
  { name: "M3", brandName: "BMW", type: CarType.Sedan },
  { name: "M4", brandName: "BMW", type: CarType.Sedan },
  { name: "M5", brandName: "BMW", type: CarType.Sedan },
  { name: "M6", brandName: "BMW", type: CarType.Sedan },
  { name: "X1", brandName: "BMW", type: CarType.Crossover },
  { name: "X2", brandName: "BMW", type: CarType.Crossover },
  { name: "X3", brandName: "BMW", type: CarType.Crossover },
  { name: "X4", brandName: "BMW", type: CarType.SUV },
  { name: "X5", brandName: "BMW", type: CarType.SUV },
  { name: "X6", brandName: "BMW", type: CarType.SUV },
  { name: "X7", brandName: "BMW", type: CarType.SUV },
  { name: "Z3", brandName: "BMW", type: CarType.Sedan },
  { name: "Z4", brandName: "BMW", type: CarType.Sedan },
  { name: "i3", brandName: "BMW", type: CarType.Sedan },
  { name: "i8", brandName: "BMW", type: CarType.Sedan },
  
  // Mercedes-Benz models
  { name: "A-Class", brandName: "Mercedes-Benz", type: CarType.Sedan },
  { name: "B-Class", brandName: "Mercedes-Benz", type: CarType.Sedan },
  { name: "C-Class", brandName: "Mercedes-Benz", type: CarType.Sedan },
  { name: "E-Class", brandName: "Mercedes-Benz", type: CarType.Sedan },
  { name: "S-Class", brandName: "Mercedes-Benz", type: CarType.Sedan },
  { name: "GLA", brandName: "Mercedes-Benz", type: CarType.Crossover },
  { name: "GLB", brandName: "Mercedes-Benz", type: CarType.Crossover },
  { name: "GLC", brandName: "Mercedes-Benz", type: CarType.SUV },
  { name: "GLE", brandName: "Mercedes-Benz", type: CarType.SUV },
  { name: "GLS", brandName: "Mercedes-Benz", type: CarType.SUV },
  
  // Audi models
  { name: "A1", brandName: "Audi", type: CarType.Sedan },
  { name: "A3", brandName: "Audi", type: CarType.Sedan },
  { name: "A4", brandName: "Audi", type: CarType.Sedan },
  { name: "A5", brandName: "Audi", type: CarType.Sedan },
  { name: "A6", brandName: "Audi", type: CarType.Sedan },
  { name: "A7", brandName: "Audi", type: CarType.Sedan },
  { name: "A8", brandName: "Audi", type: CarType.Sedan },
  { name: "TT", brandName: "Audi", type: CarType.Sedan },
  { name: "R8", brandName: "Audi", type: CarType.Sedan },
  { name: "Q2", brandName: "Audi", type: CarType.Crossover },
  { name: "Q3", brandName: "Audi", type: CarType.Crossover },
  { name: "Q5", brandName: "Audi", type: CarType.SUV },
  { name: "Q7", brandName: "Audi", type: CarType.SUV },
  { name: "Q8", brandName: "Audi", type: CarType.SUV },
  
  // Toyota models
  { name: "Camry", brandName: "Toyota", type: CarType.Sedan },
  { name: "Corolla", brandName: "Toyota", type: CarType.Sedan },
  { name: "Prius", brandName: "Toyota", type: CarType.Sedan },
  { name: "RAV4", brandName: "Toyota", type: CarType.SUV },
  { name: "Highlander", brandName: "Toyota", type: CarType.SUV },
  { name: "Land Cruiser", brandName: "Toyota", type: CarType.SUV },
  { name: "Yaris", brandName: "Toyota", type: CarType.Sedan },
  { name: "Avalon", brandName: "Toyota", type: CarType.Sedan },
  
  // Honda models
  { name: "Civic", brandName: "Honda", type: CarType.Sedan },
  { name: "Accord", brandName: "Honda", type: CarType.Sedan },
  { name: "CR-V", brandName: "Honda", type: CarType.SUV },
  { name: "Pilot", brandName: "Honda", type: CarType.SUV },
  { name: "Fit", brandName: "Honda", type: CarType.Sedan },
  { name: "HR-V", brandName: "Honda", type: CarType.Crossover },
  
  // Hyundai models
  { name: "Elantra", brandName: "Hyundai", type: CarType.Sedan },
  { name: "Sonata", brandName: "Hyundai", type: CarType.Sedan },
  { name: "Tucson", brandName: "Hyundai", type: CarType.SUV },
  { name: "Santa Fe", brandName: "Hyundai", type: CarType.SUV },
  { name: "Accent", brandName: "Hyundai", type: CarType.Sedan },
  { name: "Genesis", brandName: "Hyundai", type: CarType.Sedan },
  
  // Kia models
  { name: "Forte", brandName: "Kia", type: CarType.Sedan },
  { name: "Optima", brandName: "Kia", type: CarType.Sedan },
  { name: "Sorento", brandName: "Kia", type: CarType.SUV },
  { name: "Sportage", brandName: "Kia", type: CarType.SUV },
  { name: "Soul", brandName: "Kia", type: CarType.Crossover },
  { name: "Rio", brandName: "Kia", type: CarType.Sedan },
  
  // Volkswagen models
  { name: "Golf", brandName: "Volkswagen", type: CarType.Sedan },
  { name: "Jetta", brandName: "Volkswagen", type: CarType.Sedan },
  { name: "Passat", brandName: "Volkswagen", type: CarType.Sedan },
  { name: "Tiguan", brandName: "Volkswagen", type: CarType.SUV },
  { name: "Atlas", brandName: "Volkswagen", type: CarType.SUV },
  { name: "Beetle", brandName: "Volkswagen", type: CarType.Sedan },
  
  // Ford models
  { name: "Focus", brandName: "Ford", type: CarType.Sedan },
  { name: "Fusion", brandName: "Ford", type: CarType.Sedan },
  { name: "Mustang", brandName: "Ford", type: CarType.Sedan },
  { name: "Explorer", brandName: "Ford", type: CarType.SUV },
  { name: "Escape", brandName: "Ford", type: CarType.SUV },
  { name: "F-150", brandName: "Ford", type: CarType.Sedan },
  
  // Chevrolet models
  { name: "Cruze", brandName: "Chevrolet", type: CarType.Sedan },
  { name: "Malibu", brandName: "Chevrolet", type: CarType.Sedan },
  { name: "Impala", brandName: "Chevrolet", type: CarType.Sedan },
  { name: "Equinox", brandName: "Chevrolet", type: CarType.SUV },
  { name: "Tahoe", brandName: "Chevrolet", type: CarType.SUV },
  { name: "Suburban", brandName: "Chevrolet", type: CarType.SUV },
  
  // Nissan models
  { name: "Altima", brandName: "Nissan", type: CarType.Sedan },
  { name: "Sentra", brandName: "Nissan", type: CarType.Sedan },
  { name: "Maxima", brandName: "Nissan", type: CarType.Sedan },
  { name: "Rogue", brandName: "Nissan", type: CarType.SUV },
  { name: "Pathfinder", brandName: "Nissan", type: CarType.SUV },
  { name: "Murano", brandName: "Nissan", type: CarType.SUV },
  
  // Mazda models
  { name: "Mazda3", brandName: "Mazda", type: CarType.Sedan },
  { name: "Mazda6", brandName: "Mazda", type: CarType.Sedan },
  { name: "CX-3", brandName: "Mazda", type: CarType.Crossover },
  { name: "CX-5", brandName: "Mazda", type: CarType.SUV },
  { name: "CX-9", brandName: "Mazda", type: CarType.SUV },
  { name: "MX-5", brandName: "Mazda", type: CarType.Sedan },
  
  // Subaru models
  { name: "Impreza", brandName: "Subaru", type: CarType.Sedan },
  { name: "Legacy", brandName: "Subaru", type: CarType.Sedan },
  { name: "Outback", brandName: "Subaru", type: CarType.SUV },
  { name: "Forester", brandName: "Subaru", type: CarType.SUV },
  { name: "Ascent", brandName: "Subaru", type: CarType.SUV },
  { name: "WRX", brandName: "Subaru", type: CarType.Sedan },
  
  // Tesla models
  { name: "Model S", brandName: "Tesla", type: CarType.Sedan },
  { name: "Model 3", brandName: "Tesla", type: CarType.Sedan },
  { name: "Model X", brandName: "Tesla", type: CarType.SUV },
  { name: "Model Y", brandName: "Tesla", type: CarType.SUV },
  { name: "Cybertruck", brandName: "Tesla", type: CarType.Sedan },
  
  // Land Rover models
  { name: "Range Rover", brandName: "Land Rover", type: CarType.SUV },
  { name: "Discovery", brandName: "Land Rover", type: CarType.SUV },
  { name: "Defender", brandName: "Land Rover", type: CarType.SUV },
  { name: "Evoque", brandName: "Land Rover", type: CarType.SUV },
  
  // Porsche models
  { name: "911", brandName: "Porsche", type: CarType.Sedan },
  { name: "Cayenne", brandName: "Porsche", type: CarType.SUV },
  { name: "Macan", brandName: "Porsche", type: CarType.SUV },
  { name: "Panamera", brandName: "Porsche", type: CarType.Sedan },
  { name: "Boxster", brandName: "Porsche", type: CarType.Sedan },
  { name: "Cayman", brandName: "Porsche", type: CarType.Sedan },
  
  // Lexus models
  { name: "ES", brandName: "Lexus", type: CarType.Sedan },
  { name: "IS", brandName: "Lexus", type: CarType.Sedan },
  { name: "GS", brandName: "Lexus", type: CarType.Sedan },
  { name: "LS", brandName: "Lexus", type: CarType.Sedan },
  { name: "RX", brandName: "Lexus", type: CarType.SUV },
  { name: "GX", brandName: "Lexus", type: CarType.SUV },
  { name: "LX", brandName: "Lexus", type: CarType.SUV },
  
  // Mitsubishi models
  { name: "Lancer", brandName: "Mitsubishi", type: CarType.Sedan },
  { name: "Outlander", brandName: "Mitsubishi", type: CarType.SUV },
  { name: "Eclipse", brandName: "Mitsubishi", type: CarType.Sedan },
  { name: "Pajero", brandName: "Mitsubishi", type: CarType.SUV },
  { name: "Mirage", brandName: "Mitsubishi", type: CarType.Sedan },
  
  // Infiniti models
  { name: "Q50", brandName: "Infiniti", type: CarType.Sedan },
  { name: "Q60", brandName: "Infiniti", type: CarType.Sedan },
  { name: "Q70", brandName: "Infiniti", type: CarType.Sedan },
  { name: "QX50", brandName: "Infiniti", type: CarType.SUV },
  { name: "QX60", brandName: "Infiniti", type: CarType.SUV },
  { name: "QX80", brandName: "Infiniti", type: CarType.SUV },
  
  // Jeep models
  { name: "Wrangler", brandName: "Jeep", type: CarType.SUV },
  { name: "Grand Cherokee", brandName: "Jeep", type: CarType.SUV },
  { name: "Cherokee", brandName: "Jeep", type: CarType.SUV },
  { name: "Compass", brandName: "Jeep", type: CarType.SUV },
  { name: "Renegade", brandName: "Jeep", type: CarType.SUV },
  
  // Add Jetour model from backup data
  { name: "X70", brandName: "Jetour", type: CarType.SUV }
];

// Car data imported from extracted backup (1,206 cars with full mappings)

const mapCarType = (type: string): CarType => {
  const normalizedType = type.trim().toLowerCase();
  switch (normalizedType) {
    case 'bike':
      return CarType.Bike;
    case 'sedan':
      return CarType.Sedan;
    case 'crossover':
      return CarType.Crossover;
    case 'suv':
      return CarType.SUV;
    case 'van':
      return CarType.VAN;
    default:
      console.warn(`Unknown car type: ${type}, defaulting to Sedan`);
      return CarType.Sedan;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // Clear existing data in reverse order of dependencies
    console.log('🗑️  Clearing existing data...');
    await prisma.car.deleteMany();
    await prisma.model.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.customer.deleteMany();

    // Seed Brands - Include all brands from car data
    console.log('🏢 Seeding brands...');
    const brandMap = new Map<string, string>();
    const processedBrands = new Set<string>();
    
    // First, seed the predefined brands
    for (const brandData of brands) {
      if (processedBrands.has(brandData.name)) continue;
      
      try {
        const brand = await prisma.brand.create({
          data: {
            name: brandData.name,
          },
        });
        brandMap.set(brandData.name, brand.id);
        processedBrands.add(brandData.name);
        console.log(`  ✓ Created brand: ${brandData.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to create brand ${brandData.name}:`, error);
      }
    }

    // Then, create any missing brands from car data
    for (const carData of carsData) {
      if (processedBrands.has(carData.brandName)) continue;

      try {
        const brand = await prisma.brand.create({
          data: {
            name: carData.brandName,
          },
        });
        brandMap.set(carData.brandName, brand.id);
        processedBrands.add(carData.brandName);
        console.log(`  ✓ Created brand: ${carData.brandName} (auto-generated from car data)`);
      } catch (error) {
        console.error(`  ✗ Failed to create brand ${carData.brandName}:`, error);
      }
    }

    // Seed Customers
    console.log(`👥 Seeding customers... (${customers.length} total)`);
    const customerMap = new Map<string, string>();
    
    for (const customerData of customers) {
      try {
        const customer = await prisma.customer.create({
          data: {
            fName: customerData.fName,
            lName: customerData.lName,
            mobileNumber: customerData.mobileNumber,
            count: 0,
            isActive: true,
          },
        });
        customerMap.set(customerData.mobileNumber, customer.id);
        console.log(`  ✓ Created customer: ${customerData.fName} ${customerData.lName} (${customerData.mobileNumber})`);
      } catch (error) {
        console.error(`  ✗ Failed to create customer ${customerData.fName} ${customerData.lName}:`, error);
      }
    }

    // Seed Models - Create models dynamically from car data
    console.log('🚗 Seeding models...');
    const modelMap = new Map<string, string>();
    const processedModels = new Set<string>();
    
    // First, seed the predefined models
    for (const modelData of modelsData) {
      try {
        const brandId = brandMap.get(modelData.brandName);
        if (!brandId) {
          console.warn(`  ⚠️  Brand not found: ${modelData.brandName}, skipping model: ${modelData.name}`);
          continue;
        }

        const modelKey = `${modelData.brandName}-${modelData.name}`;
        if (processedModels.has(modelKey)) continue;

        const model = await prisma.model.create({
          data: {
            name: modelData.name,
            brandId: brandId,
            type: modelData.type,
          },
        });
        
        modelMap.set(modelKey, model.id);
        processedModels.add(modelKey);
        console.log(`  ✓ Created model: ${modelData.name} (${modelData.brandName}) - ${modelData.type}`);
      } catch (error) {
        console.error(`  ✗ Failed to create model ${modelData.name}:`, error);
      }
    }

    // Then, create any missing models from car data
    for (const carData of carsData) {
      const modelKey = `${carData.brandName}-${carData.modelName}`;
      if (processedModels.has(modelKey)) continue;

      try {
        const brandId = brandMap.get(carData.brandName);
        if (!brandId) continue;

        const model = await prisma.model.create({
          data: {
            name: carData.modelName,
            brandId: brandId,
            type: CarType.Sedan, // Default type for models not in predefined list
          },
        });
        
        modelMap.set(modelKey, model.id);
        processedModels.add(modelKey);
        console.log(`  ✓ Created model: ${carData.modelName} (${carData.brandName}) - Sedan (auto-generated)`);
      } catch (error) {
        console.error(`  ✗ Failed to create model ${carData.modelName}:`, error);
      }
    }

    // Seed Cars
    console.log(`🚙 Seeding cars... (${carsData.length} total)`);
    let carCount = 0;
    
    for (const carData of carsData) {
      try {
        const customerId = customerMap.get(carData.customerMobile);
        if (!customerId) {
          console.warn(`  ⚠️  Customer not found: ${carData.customerMobile}, skipping car: ${carData.plateNumber}`);
          continue;
        }

        const brandId = brandMap.get(carData.brandName);
        if (!brandId) {
          console.warn(`  ⚠️  Brand not found: ${carData.brandName}, skipping car: ${carData.plateNumber}`);
          continue;
        }

        const modelKey = `${carData.brandName}-${carData.modelName}`;
        const modelId = modelMap.get(modelKey);
        if (!modelId) {
          console.warn(`  ⚠️  Model not found: ${carData.modelName} (${carData.brandName}), skipping car: ${carData.plateNumber}`);
          continue;
        }

        const car = await prisma.car.create({
          data: {
            plateNumber: carData.plateNumber,
            year: carData.year ? carData.year.toString() : null,
            color: carData.color,
            brandId: brandId,
            customerId: customerId,
            modelId: modelId,
          },
        });
        
        carCount++;
        console.log(`  ✓ Created car: ${carData.plateNumber} - ${carData.brandName} ${carData.modelName} (${carData.customerMobile})`);
      } catch (error) {
        console.error(`  ✗ Failed to create car ${carData.plateNumber}:`, error);
      }
    }

    // Display summary
    const finalCounts = {
      brands: await prisma.brand.count(),
      customers: await prisma.customer.count(),
      models: await prisma.model.count(),
      cars: await prisma.car.count(),
    };

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Final Summary:');
    console.log(`  • Brands: ${finalCounts.brands}`);
    console.log(`  • Customers: ${finalCounts.customers}`);
    console.log(`  • Models: ${finalCounts.models}`);
    console.log(`  • Cars: ${finalCounts.cars}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder
if (require.main === module) {
  main();
}

export { main as seedComprehensive };