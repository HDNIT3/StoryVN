import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { ReadingHistoryController } from './controllers/reading-history.controller.js';
import {
  ReadingHistory,
  ReadingHistorySchema,
} from './schemas/reading-history.schema.js';
import { ReadingHistoryService } from './services/reading-history.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingHistory.name, schema: ReadingHistorySchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Story.name, schema: StorySchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
  ],
  controllers: [ReadingHistoryController],
  providers: [ReadingHistoryService],
  exports: [ReadingHistoryService, MongooseModule],
})
export class ReadingHistoryModule {}
