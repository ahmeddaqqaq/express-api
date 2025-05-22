// src/image/image.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Delete,
  Body,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { ValidationPipe } from '../pipes/validation.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Images')
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('image'))
  // @ApiOperation({ summary: 'Upload an image' })
  // @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  // async uploadImage(
  //   @UploadedFile(new ValidationPipe()) file: Express.Multer.File,
  // ) {
  //   const image = await this.imageService.createImage(file);
  //   return {
  //     message: 'Image uploaded successfully',
  //     image,
  //   };
  // }

  @Get()
  @ApiOperation({ summary: 'Get image details' })
  async getImages() {
    return this.imageService.fetchAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get image details' })
  async getImage(@Param('id') id: string) {
    return this.imageService.getImage(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image' })
  async deleteImage(@Param('id') id: string) {
    await this.imageService.deleteImage(id);
    return { message: 'Image deleted successfully' };
  }

  @Patch('assign-to-brand')
  @ApiOperation({ summary: 'Assign image to brand as logo' })
  async assignToBrand(@Body() body: { imageId: string; brandId: string }) {
    const image = await this.imageService.assignImageToBrand(
      body.imageId,
      body.brandId,
    );
    return {
      message: 'Image assigned to brand successfully',
      image,
    };
  }

  @Patch('assign-to-transaction')
  @ApiOperation({ summary: 'Assign images to transaction' })
  async assignToTransaction(
    @Body() body: { imageIds: string[]; transactionId: string },
  ) {
    const transaction = await this.imageService.assignImagesToTransaction(
      body.imageIds,
      body.transactionId,
    );
    return {
      message: 'Images assigned to transaction successfully',
      transaction,
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(new ValidationPipe()) file: Express.Multer.File,
  ) {
    const image = await this.imageService.createImage(file);
    return {
      message: 'Image uploaded successfully',
      image,
    };
  }
}
