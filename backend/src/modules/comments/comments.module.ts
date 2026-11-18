import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema.js';
import { ForumPost, ForumPostSchema } from '../forum/schemas/forum-post.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { CommentsController } from './controllers/comments.controller.js';
import { Comment, CommentSchema } from './schemas/comment.schema.js';
import { CommentsService } from './services/comments.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Story.name, schema: StorySchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: ForumPost.name, schema: ForumPostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

