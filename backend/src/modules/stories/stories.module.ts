import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorProfile, AuthorProfileSchema } from '../users/schemas/author-profile.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { ChaptersModule } from '../chapters/chapters.module.js';
import { AdminStoriesController } from './controllers/admin-stories.controller.js';
import { StoriesController } from './controllers/stories.controller.js';
import { Story, StorySchema } from './schemas/story.schema.js';
import {
  StoryDailyView,
  StoryDailyViewSchema,
} from './schemas/story-daily-view.schema.js';
import { AdminStoriesService } from './services/admin-stories.service.js';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema.js';
import { StoriesService } from './services/stories.service.js';
import { DiscoveryController } from './controllers/discovery.controller.js';
import { DiscoveryService } from './services/discovery.service.js';
import { ChapterUnlock, ChapterUnlockSchema } from '../chapters/schemas/chapter-unlock.schema.js';
import { Follow, FollowSchema } from '../follows/schemas/follow.schema.js';
import { ReadingHistory, ReadingHistorySchema } from '../reading-history/schemas/reading-history.schema.js';
import { StoryRating, StoryRatingSchema } from '../story-ratings/schemas/story-rating.schema.js';

@Module({
  imports: [
    ChaptersModule,
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: StoryDailyView.name, schema: StoryDailyViewSchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: ChapterUnlock.name, schema: ChapterUnlockSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: ReadingHistory.name, schema: ReadingHistorySchema },
      { name: StoryRating.name, schema: StoryRatingSchema },
    ]),
  ],
  controllers: [DiscoveryController, StoriesController, AdminStoriesController],
  providers: [StoriesService, AdminStoriesService, DiscoveryService],
  exports: [StoriesService, AdminStoriesService, MongooseModule],
})
export class StoriesModule { }
