import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyNoteDto } from './dto/create-daily-note.dto';
import { UpdateDailyNoteDto } from './dto/update-daily-note.dto';
import { FilterDailyNotesDto } from './dto/filter-daily-notes.dto';

@Injectable()
export class DailyNoteService {
  constructor(private prisma: PrismaService) {}

  async create(createDailyNoteDto: CreateDailyNoteDto, createdById: string) {
    const { note, imageIds } = createDailyNoteDto;

    // Validate images exist and are not already assigned
    if (imageIds && imageIds.length > 0) {
      const images = await this.prisma.image.findMany({
        where: {
          id: { in: imageIds },
          isActive: true,
        },
      });

      if (images.length !== imageIds.length) {
        throw new BadRequestException(
          'One or more images not found or inactive',
        );
      }

      // Check if any images are already assigned to daily notes
      const assignedImages = images.filter((img) => img.dailyNoteId !== null);
      if (assignedImages.length > 0) {
        throw new BadRequestException(
          `Images already assigned to daily notes: ${assignedImages
            .map((img) => img.id)
            .join(', ')}`,
        );
      }
    }

    // Create the daily note
    const dailyNote = await this.prisma.dailyNote.create({
      data: {
        note,
        createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        images: {
          where: { isActive: true },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Update images to be associated with this daily note
    if (imageIds && imageIds.length > 0) {
      await this.prisma.image.updateMany({
        where: {
          id: { in: imageIds },
        },
        data: {
          dailyNoteId: dailyNote.id,
        },
      });

      // Fetch the updated daily note with images
      return this.findOne(dailyNote.id);
    }

    return dailyNote;
  }

  async findAll(
    filter?: FilterDailyNotesDto,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    // Date filtering
    if (filter?.date) {
      const startOfDay = new Date(filter.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filter.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        startDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = startDate;
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // User filtering
    if (filter?.createdById) {
      where.createdById = filter.createdById;
    }

    const [notes, total] = await Promise.all([
      this.prisma.dailyNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          images: {
            where: { isActive: true },
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.dailyNote.count({ where }),
    ]);

    return {
      data: notes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const note = await this.prisma.dailyNote.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        images: {
          where: { isActive: true },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Daily note not found');
    }

    return note;
  }

  async update(
    id: string,
    updateDailyNoteDto: UpdateDailyNoteDto,
    userId: string,
  ) {
    const existingNote = await this.prisma.dailyNote.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!existingNote) {
      throw new NotFoundException('Daily note not found');
    }

    // Only allow the creator to edit their note
    if (existingNote.createdById !== userId) {
      throw new ForbiddenException('You can only edit your own daily notes');
    }

    const { note, imageIds } = updateDailyNoteDto;

    // Validate images if provided
    if (imageIds && imageIds.length > 0) {
      const images = await this.prisma.image.findMany({
        where: {
          id: { in: imageIds },
          isActive: true,
        },
      });

      if (images.length !== imageIds.length) {
        throw new BadRequestException(
          'One or more images not found or inactive',
        );
      }

      // Check if any images are already assigned to other daily notes
      const assignedImages = images.filter(
        (img) => img.dailyNoteId !== null && img.dailyNoteId !== id,
      );
      if (assignedImages.length > 0) {
        throw new BadRequestException(
          `Images already assigned to other daily notes: ${assignedImages
            .map((img) => img.id)
            .join(', ')}`,
        );
      }
    }

    // Update the note
    const updateData: any = {};
    if (note !== undefined) {
      updateData.note = note;
    }

    const updatedNote = await this.prisma.dailyNote.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        images: {
          where: { isActive: true },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Update image associations if provided
    if (imageIds !== undefined) {
      // First, unassign all current images
      await this.prisma.image.updateMany({
        where: {
          dailyNoteId: id,
        },
        data: {
          dailyNoteId: null,
        },
      });

      // Then assign new images
      if (imageIds.length > 0) {
        await this.prisma.image.updateMany({
          where: {
            id: { in: imageIds },
          },
          data: {
            dailyNoteId: id,
          },
        });
      }

      // Fetch the updated note with new images
      return this.findOne(id);
    }

    return updatedNote;
  }

  async remove(id: string, userId: string) {
    const existingNote = await this.prisma.dailyNote.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!existingNote) {
      throw new NotFoundException('Daily note not found');
    }

    // Only allow the creator to delete their note
    if (existingNote.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own daily notes');
    }

    // Soft delete by setting isActive to false
    await this.prisma.dailyNote.update({
      where: { id },
      data: { isActive: false },
    });

    // Unassign any images from this note
    await this.prisma.image.updateMany({
      where: {
        dailyNoteId: id,
      },
      data: {
        dailyNoteId: null,
      },
    });

    return { message: 'Daily note deleted successfully' };
  }

  async findByDate(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.dailyNote.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        images: {
          where: { isActive: true },
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }
}
