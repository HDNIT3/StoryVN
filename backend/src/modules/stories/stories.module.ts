import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorProfile, AuthorProfileSchema } from '../users/schemas/author-profile.schema.js';
import { StoriesController } from './controllers/stories.controller.js';
import { Story, StorySchema } from './schemas/story.schema.js';
import { StoriesService } from './services/stories.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
    ]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService, MongooseModule],
})
export class StoriesModule { }
