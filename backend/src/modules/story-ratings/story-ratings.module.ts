import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { StoryRatingsController } from './controllers/story-ratings.controller.js';
import {
  StoryRating,
  StoryRatingSchema,
} from './schemas/story-rating.schema.js';
import { StoryRatingsService } from './services/story-ratings.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoryRating.name, schema: StoryRatingSchema },
      { name: Story.name, schema: StorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StoryRatingsController],
  providers: [StoryRatingsService],
  exports: [StoryRatingsService],
})
export class StoryRatingsModule {}

