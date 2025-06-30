import { PrismaClient, CarType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CarData {
  brand: string;
  model: string;
  type: string;
}

// Map CSV type values to your CarType enum
const mapCarType = (type: string): CarType => {
  const normalizedType = type.toLowerCase().trim();

  switch (normalizedType) {
    case 'bike':
    case 'motorcycle':
      return CarType.Bike;
    case 'sedan':
      return CarType.Sedan;
    case 'crossover':
    case 'cross-over':
      return CarType.Crossover;
    case 'suv':
      return CarType.SUV;
    case 'van':
    case 'minivan':
      return CarType.VAN;
    default:
      console.warn(`Unknown car type: ${type}, defaulting to Sedan`);
      return CarType.Sedan;
  }
};

async function seedBrandsAndModels() {
  try {
    console.log('🌱 Starting brand and model seeding...');

    // Read and parse CSV file
    const csvFilePath = path.join(__dirname, 'car-data.csv'); // Adjust path as needed
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');

    const records: CarData[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${records.length} records in CSV`);

    // Group data by brand
    const brandMap = new Map<string, Set<{ model: string; type: CarType }>>();

    records.forEach((record) => {
      const brandName = record.brand.trim();
      const modelName = record.model.trim();
      const carType = mapCarType(record.type);

      if (!brandMap.has(brandName)) {
        brandMap.set(brandName, new Set());
      }

      // Use JSON stringify for Set comparison since objects need deep comparison
      const modelData = { model: modelName, type: carType };
      const existingModels = Array.from(brandMap.get(brandName)!);

      if (
        !existingModels.some(
          (existing) =>
            existing.model === modelData.model &&
            existing.type === modelData.type,
        )
      ) {
        brandMap.get(brandName)!.add(modelData);
      }
    });

    console.log(`🏷️  Processing ${brandMap.size} unique brands`);

    // Seed brands and models
    for (const [brandName, models] of brandMap) {
      console.log(`\n🔧 Processing brand: ${brandName}`);

      // Create or find brand
      const brand = await prisma.brand.upsert({
        where: { name: brandName },
        update: {},
        create: { name: brandName },
      });

      console.log(`   ✅ Brand "${brandName}" processed`);

      // Create models for this brand
      const modelArray = Array.from(models);
      for (const { model: modelName, type } of modelArray) {
        try {
          await prisma.model.upsert({
            where: {
              brandId_name: {
                brandId: brand.id,
                name: modelName,
              },
            },
            update: { type }, // Update type if model exists
            create: {
              name: modelName,
              brandId: brand.id,
              type,
            },
          });

          console.log(`   📝 Model "${modelName}" (${type}) processed`);
        } catch (error) {
          console.error(`   ❌ Error creating model "${modelName}":`, error);
        }
      }
    }

    // Display summary
    const brandCount = await prisma.brand.count();
    const modelCount = await prisma.model.count();

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - Brands in database: ${brandCount}`);
    console.log(`   - Models in database: ${modelCount}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedBrandsAndModels().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedBrandsAndModels };
