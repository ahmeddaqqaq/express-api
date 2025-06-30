import { PrismaClient, CarType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

const prisma = new PrismaClient();

interface CsvRow {
  brand: string;
  model: string;
  type: string;
}

// Map string values to CarType enum
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

const readCsvFile = (filePath: string): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Normalize the headers (remove whitespace, convert to lowercase)
        const normalizedData: any = {};
        Object.keys(data).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase();
          normalizedData[normalizedKey] = data[key];
        });

        results.push({
          brand: normalizedData.brand?.trim() || '',
          model: normalizedData.model?.trim() || '',
          type: normalizedData.type?.trim() || '',
        });
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const seedBrandsAndModels = async (csvData: CsvRow[]) => {
  try {
    // Group models by brand
    const brandModelsMap = new Map<
      string,
      Array<{ name: string; type: CarType }>
    >();

    csvData.forEach((row) => {
      if (!row.brand || !row.model || !row.type) {
        console.warn('Skipping incomplete row:', row);
        return;
      }

      const brandName = row.brand;
      const modelName = row.model;
      const carType = mapCarType(row.type);

      if (!brandModelsMap.has(brandName)) {
        brandModelsMap.set(brandName, []);
      }

      // Check if model already exists for this brand to avoid duplicates
      const existingModels = brandModelsMap.get(brandName)!;
      const modelExists = existingModels.some((m) => m.name === modelName);

      if (!modelExists) {
        existingModels.push({ name: modelName, type: carType });
      }
    });

    console.log(`Processing ${brandModelsMap.size} brands...`);

    // Seed brands and models
    for (const [brandName, models] of brandModelsMap) {
      try {
        // Create or get existing brand
        const brand = await prisma.brand.upsert({
          where: { name: brandName },
          update: {},
          create: { name: brandName },
        });

        console.log(`✓ Brand: ${brandName} (ID: ${brand.id})`);

        // Create models for this brand
        for (const model of models) {
          try {
            const createdModel = await prisma.model.upsert({
              where: {
                brandId_name: {
                  brandId: brand.id,
                  name: model.name,
                },
              },
              update: {
                type: model.type,
              },
              create: {
                name: model.name,
                type: model.type,
                brandId: brand.id,
              },
            });

            console.log(
              `  ✓ Model: ${model.name} (${model.type}) - ID: ${createdModel.id}`,
            );
          } catch (modelError) {
            console.error(
              `  ✗ Failed to create model ${model.name}:`,
              modelError,
            );
          }
        }
      } catch (brandError) {
        console.error(`✗ Failed to create brand ${brandName}:`, brandError);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');

    // Display summary
    const totalBrands = await prisma.brand.count();
    const totalModels = await prisma.model.count();
    console.log(
      `📊 Summary: ${totalBrands} brands, ${totalModels} models in database`,
    );
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
};

const main = async () => {
  try {
    const csvFilePath = process.argv[2] || './car-models-radiant.csv';

    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      console.log('Usage: npm run seed <path-to-csv-file>');
      console.log('Example: npm run seed ./car-models-radiant.csv');
      process.exit(1);
    }

    console.log(`📂 Reading CSV file: ${csvFilePath}`);
    const csvData = await readCsvFile(csvFilePath);

    if (csvData.length === 0) {
      console.log('❌ No data found in CSV file');
      process.exit(1);
    }

    console.log(`📋 Found ${csvData.length} rows in CSV`);

    await seedBrandsAndModels(csvData);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder
if (require.main === module) {
  main();
}

export { main as seedBrandsAndModels };
