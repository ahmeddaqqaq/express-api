// image.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Param,
  Patch,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.imageService.uploadImage(file);
  }

  @Get()
  async fetchAll() {
    return this.imageService.getImages();
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    return this.imageService.deleteImage(id);
  }
}
