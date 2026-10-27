import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuthorProfile,
  AuthorProfileSchema,
} from '../users/schemas/author-profile.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { FollowsController } from './controllers/follows.controller.js';
import { Follow, FollowSchema } from './schemas/follow.schema.js';
import { FollowsService } from './services/follows.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
      { name: Story.name, schema: StorySchema },
      { name: User.name, schema: UserSchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
    ]),
  ],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService, MongooseModule],
})
export class FollowsModule {}
