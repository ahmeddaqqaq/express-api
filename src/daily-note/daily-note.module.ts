import { Module } from '@nestjs/common';
import { DailyNoteService } from './daily-note.service';
import { DailyNoteController } from './daily-note.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [PrismaModule, ImageModule],
  controllers: [DailyNoteController],
  providers: [DailyNoteService],
  exports: [DailyNoteService],
})
export class DailyNoteModule {}
