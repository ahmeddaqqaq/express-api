import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DailyNoteService } from './daily-note.service';
import { ImageService } from '../image/image.service';
import { CreateDailyNoteDto } from './dto/create-daily-note.dto';
import { UpdateDailyNoteDto } from './dto/update-daily-note.dto';
import { FilterDailyNotesDto } from './dto/filter-daily-notes.dto';
import { DailyNoteResponse, DailyNotesListResponse } from './dto/response';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@ApiTags('Daily Notes')
@Controller('daily-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
export class DailyNoteController {
  constructor(
    private readonly dailyNoteService: DailyNoteService,
    private readonly imageService: ImageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new daily note' })
  @ApiResponse({
    status: 201,
    description: 'Daily note created successfully',
    type: DailyNoteResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Images not found' })
  async create(
    @Body() createDailyNoteDto: CreateDailyNoteDto,
    @User() user: any,
  ) {
    return this.dailyNoteService.create(createDailyNoteDto, user.userId);
  }

  @Post('with-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Create a daily note with image uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Daily note with images',
    schema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: 'The content of the daily note',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to attach (max 10)',
        },
      },
      required: ['note'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Daily note with images created successfully',
    type: DailyNoteResponse,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  async createWithImages(
    @Body('note') note: string,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user: any,
  ) {
    if (!note) {
      throw new Error('Note content is required');
    }

    // Upload images first
    const imageIds: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const uploadedImage = await this.imageService.uploadImage(
          image,
          undefined,
          user.userId,
        );
        imageIds.push(uploadedImage.id);
      }
    }

    // Create the daily note with uploaded image IDs
    return this.dailyNoteService.create({ note, imageIds }, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get daily notes with optional filtering' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by specific date (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by date range - start date (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by date range - end date (YYYY-MM-DD)',
    example: '2024-03-31',
  })
  @ApiQuery({
    name: 'createdById',
    required: false,
    description: 'Filter by user who created the note',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Daily notes retrieved successfully',
    type: DailyNotesListResponse,
  })
  async findAll(
    @Query() filter: FilterDailyNotesDto,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.dailyNoteService.findAll(filter, page, limit);
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Get daily notes for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Daily notes for the specified date',
    type: [DailyNoteResponse],
  })
  async findByDate(@Param('date') date: string) {
    return this.dailyNoteService.findByDate(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a daily note by ID' })
  @ApiResponse({
    status: 200,
    description: 'Daily note retrieved successfully',
    type: DailyNoteResponse,
  })
  @ApiResponse({ status: 404, description: 'Daily note not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dailyNoteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a daily note' })
  @ApiResponse({
    status: 200,
    description: 'Daily note updated successfully',
    type: DailyNoteResponse,
  })
  @ApiResponse({ status: 404, description: 'Daily note not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only edit own notes',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDailyNoteDto: UpdateDailyNoteDto,
    @User() user: any,
  ) {
    return this.dailyNoteService.update(id, updateDailyNoteDto, user.userId);
  }

  @Patch(':id/with-images')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Update a daily note with new image uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Updated daily note with images',
    schema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: 'The updated content of the daily note',
        },
        replaceImages: {
          type: 'boolean',
          description: 'Whether to replace existing images or add to them',
          default: false,
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to attach (max 10)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Daily note with images updated successfully',
    type: DailyNoteResponse,
  })
  @ApiResponse({ status: 404, description: 'Daily note not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only edit own notes',
  })
  async updateWithImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('note') note: string,
    @Body('replaceImages') replaceImages: boolean = false,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user: any,
  ) {
    const updateData: UpdateDailyNoteDto = {};

    if (note !== undefined) {
      updateData.note = note;
    }

    // Handle image uploads
    if (images && images.length > 0) {
      const newImageIds: string[] = [];
      for (const image of images) {
        const uploadedImage = await this.imageService.uploadImage(
          image,
          undefined,
          user.userId,
        );
        newImageIds.push(uploadedImage.id);
      }

      if (replaceImages) {
        updateData.imageIds = newImageIds;
      } else {
        // Get existing images and append new ones
        const existingNote = await this.dailyNoteService.findOne(id);
        const existingImageIds = existingNote.images.map((img) => img.id);
        updateData.imageIds = [...existingImageIds, ...newImageIds];
      }
    }

    return this.dailyNoteService.update(id, updateData, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a daily note' })
  @ApiResponse({
    status: 200,
    description: 'Daily note deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Daily note deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Daily note not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own notes',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @User() user: any) {
    return this.dailyNoteService.remove(id, user.userId);
  }
}
