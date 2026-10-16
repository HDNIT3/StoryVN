import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from './schemas/chapter.schema.js';
import {
  ChapterUpdate,
  ChapterUpdateSchema,
} from './schemas/chapter-update.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ChaptersController } from './controllers/chapters.controller.js';
import { AdminChaptersController } from './controllers/admin-chapters.controller.js';
import { ChaptersService } from './services/chapters.service.js';
import { AdminChaptersService } from './services/admin-chapters.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: ChapterUpdate.name, schema: ChapterUpdateSchema },
      { name: Story.name, schema: StorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ChaptersController, AdminChaptersController],
  providers: [ChaptersService, AdminChaptersService],
  exports: [ChaptersService, AdminChaptersService, MongooseModule],
})
export class ChaptersModule {}

