import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SeederService } from './seeder.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

interface SeedByCsvPathDto {
  csvFilePath: string;
}

@Controller('seeder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class SeederController {
  private readonly logger = new Logger(SeederController.name);

  constructor(private readonly seederService: SeederService) {}

  @Post('seed-from-file')
  async seedFromFile(@Body() dto: SeedByCsvPathDto) {
    try {
      if (!dto.csvFilePath) {
        throw new BadRequestException('CSV file path is required');
      }

      const result = await this.seederService.seedFromCsv(dto.csvFilePath);

      return {
        message: result.success
          ? 'Seeding completed successfully'
          : 'Seeding completed with errors',
        success: result.success,
        data: {
          brandsCreated: result.brandsCreated,
          modelsCreated: result.modelsCreated,
          errorsCount: result.errors.length,
          errors: result.errors,
        },
      };
    } catch (error) {
      this.logger.error('Seeding failed:', error);
      throw new BadRequestException(`Seeding failed: ${error.message}`);
    }
  }

  @Post('seed-from-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            'brands-models-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype !== 'text/csv' &&
          !file.originalname.endsWith('.csv')
        ) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async seedFromUpload(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('CSV file is required');
      }

      this.logger.log(`Processing uploaded file: ${file.filename}`);
      const result = await this.seederService.seedFromCsv(file.path);

      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        message: result.success
          ? 'Seeding completed successfully'
          : 'Seeding completed with errors',
        success: result.success,
        data: {
          brandsCreated: result.brandsCreated,
          modelsCreated: result.modelsCreated,
          errorsCount: result.errors.length,
          errors: result.errors,
        },
      };
    } catch (error) {
      this.logger.error('Seeding failed:', error);

      // Clean up uploaded file in case of error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      throw new BadRequestException(`Seeding failed: ${error.message}`);
    }
  }

  @Get('brands')
  async getBrands(@Query('name') brandName?: string) {
    try {
      const brands = await this.seederService.getBrandWithModels(brandName);

      return {
        message: 'Brands retrieved successfully',
        data: brands,
        count: brands.length,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve brands:', error);
      throw new BadRequestException(
        `Failed to retrieve brands: ${error.message}`,
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      const stats = await this.seederService.getSeederStats();

      return {
        message: 'Statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve stats:', error);
      throw new BadRequestException(
        `Failed to retrieve stats: ${error.message}`,
      );
    }
  }
}
