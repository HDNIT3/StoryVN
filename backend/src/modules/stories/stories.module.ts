import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorProfile, AuthorProfileSchema } from '../users/schemas/author-profile.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { AdminStoriesController } from './controllers/admin-stories.controller.js';
import { PublicStoriesController } from './controllers/public-stories.controller.js';
import { StoriesController } from './controllers/stories.controller.js';
import {
  StoryFollow,
  StoryFollowSchema,
  StoryLike,
  StoryLikeSchema,
  StoryRating,
  StoryRatingSchema,
} from './schemas/story-interaction.schema.js';
import { Story, StorySchema } from './schemas/story.schema.js';
import { PublicStoriesService } from './services/public-stories.service.js';
import { StoriesService } from './services/stories.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: StoryLike.name, schema: StoryLikeSchema },
      { name: StoryFollow.name, schema: StoryFollowSchema },
      { name: StoryRating.name, schema: StoryRatingSchema },
    ]),
  ],
  controllers: [StoriesController, AdminStoriesController, PublicStoriesController],
  providers: [StoriesService, PublicStoriesService],
  exports: [StoriesService, PublicStoriesService, MongooseModule],
})
export class StoriesModule {}
