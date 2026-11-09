import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from '../follows/schemas/follow.schema.js';
import { Chapter, ChapterSchema } from './schemas/chapter.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import {
  StoryDailyView,
  StoryDailyViewSchema,
} from '../stories/schemas/story-daily-view.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ChaptersController } from './controllers/chapters.controller.js';
import { AdminChaptersController } from './controllers/admin-chapters.controller.js';
import { ChaptersService } from './services/chapters.service.js';
import { AdminChaptersService } from './services/admin-chapters.service.js';
import { ChapterReleaseService } from './services/chapter-release.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chapter.name, schema: ChapterSchema },
      { name: Story.name, schema: StorySchema },
      { name: StoryDailyView.name, schema: StoryDailyViewSchema },
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
  ],
  controllers: [ChaptersController, AdminChaptersController],
  providers: [ChaptersService, AdminChaptersService, ChapterReleaseService],
  exports: [
    ChaptersService,
    AdminChaptersService,
    ChapterReleaseService,
    MongooseModule,
  ],
})
export class ChaptersModule {}

