import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthorProfile, AuthorProfileSchema } from '../users/schemas/author-profile.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { AdminStoriesController } from './controllers/admin-stories.controller.js';
import { StoriesController } from './controllers/stories.controller.js';
import { Story, StorySchema } from './schemas/story.schema.js';
import { AdminStoriesService } from './services/admin-stories.service.js';
import { StoriesService } from './services/stories.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
  ],
  controllers: [StoriesController, AdminStoriesController],
  providers: [StoriesService, AdminStoriesService],
  exports: [StoriesService, AdminStoriesService, MongooseModule],
})
export class StoriesModule { }
