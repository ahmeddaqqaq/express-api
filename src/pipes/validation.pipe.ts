import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Express } from 'express';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  // Original class validator implementation
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, { whitelist: true });
    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }
    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): any {
    return errors.map((error) => ({
      property: error.property,
      constraints: error.constraints,
    }));
  }

  // New image validation methods
  static validateImageFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Validate filename
    const validFileNameRegex = /^[a-zA-Z0-9_\-. ]+$/;
    if (!validFileNameRegex.test(file.originalname)) {
      throw new BadRequestException(
        'Invalid file name. Only alphanumeric, spaces, hyphens, underscores and dots are allowed',
      );
    }

    return file;
  }
}
