import { Injectable, Logger } from '@nestjs/common';
import { CarType } from '@prisma/client';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { PrismaService } from 'src/prisma/prisma.service';

interface CsvRow {
  brand: string;
  model: string;
  type: string;
}

interface SeedResult {
  success: boolean;
  brandsCreated: number;
  modelsCreated: number;
  errors: string[];
}

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private prisma: PrismaService) {}

  private mapCarType(type: string): CarType {
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
        this.logger.warn(`Unknown car type: ${type}, defaulting to Sedan`);
        return CarType.Sedan;
    }
  }

  private async readCsvFile(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];

      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`));
        return;
      }

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
  }

  async seedFromCsv(csvFilePath: string): Promise<SeedResult> {
    const result: SeedResult = {
      success: false,
      brandsCreated: 0,
      modelsCreated: 0,
      errors: [],
    };

    try {
      this.logger.log(`Reading CSV file: ${csvFilePath}`);
      const csvData = await this.readCsvFile(csvFilePath);

      if (csvData.length === 0) {
        result.errors.push('No data found in CSV file');
        return result;
      }

      this.logger.log(`Found ${csvData.length} rows in CSV`);

      // Group models by brand
      const brandModelsMap = new Map<
        string,
        Array<{ name: string; type: CarType }>
      >();

      csvData.forEach((row) => {
        if (!row.brand || !row.model || !row.type) {
          this.logger.warn('Skipping incomplete row:', row);
          return;
        }

        const brandName = row.brand;
        const modelName = row.model;
        const carType = this.mapCarType(row.type);

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

      this.logger.log(`Processing ${brandModelsMap.size} brands...`);

      // Seed brands and models
      for (const [brandName, models] of brandModelsMap) {
        try {
          // Create or get existing brand
          const brand = await this.prisma.brand.upsert({
            where: { name: brandName },
            update: {},
            create: { name: brandName },
          });

          result.brandsCreated++;
          this.logger.log(`✓ Brand: ${brandName}`);

          // Create models for this brand
          for (const model of models) {
            try {
              await this.prisma.model.upsert({
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

              result.modelsCreated++;
              this.logger.log(`  ✓ Model: ${model.name} (${model.type})`);
            } catch (modelError) {
              const errorMsg = `Failed to create model ${model.name}: ${modelError.message}`;
              this.logger.error(errorMsg);
              result.errors.push(errorMsg);
            }
          }
        } catch (brandError) {
          const errorMsg = `Failed to create brand ${brandName}: ${brandError.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      this.logger.log(
        `🎉 Seeding completed! Brands: ${result.brandsCreated}, Models: ${result.modelsCreated}`,
      );
    } catch (error) {
      result.errors.push(error.message);
      this.logger.error('Error during seeding:', error);
    }

    return result;
  }

  async getBrandWithModels(brandName?: string) {
    const whereClause = brandName ? { name: brandName } : {};

    return await this.prisma.brand.findMany({
      where: whereClause,
      include: {
        models: true,
        _count: {
          select: { models: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSeederStats() {
    const [totalBrands, totalModels] = await Promise.all([
      this.prisma.brand.count(),
      this.prisma.model.count(),
    ]);

    return {
      totalBrands,
      totalModels,
    };
  }
}
