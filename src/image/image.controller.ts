// image.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Param,
  Get,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImageService } from './image.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { FilterImagesDto } from './dto/filter-images.dto';

@Controller('images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
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
  @ApiOperation({ summary: 'Get all images with optional stage filtering' })
  @ApiQuery({
    name: 'uploadedAtStage',
    required: false,
    description: 'Filter images by upload stage',
    enum: ['scheduled', 'stageOne', 'stageTwo', 'stageThree', 'completed', 'cancelled'],
  })
  @ApiResponse({ status: 200, description: 'Images retrieved successfully' })
  async fetchAll(@Query() filter: FilterImagesDto) {
    return this.imageService.getImages(filter);
  }

  @Get('serve/:key(*)')
  @ApiOperation({ summary: 'Serve image with proper CORS headers' })
  @ApiResponse({ status: 200, description: 'Image served successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async serveImage(@Param('key') key: string, @Res() res: Response) {
    try {
      const imageData = await this.imageService.getImageStream(key);
      
      // Set CORS headers
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Type': imageData.contentType,
      });

      // Send the buffer directly
      res.send(imageData.buffer);
    } catch (error) {
      throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    return this.imageService.deleteImage(id);
  }
}
