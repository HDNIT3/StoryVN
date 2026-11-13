import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { AuthorRequest, AuthorRequestSchema } from '../users/schemas/author-request.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { StoryDailyView, StoryDailyViewSchema } from '../stories/schemas/story-daily-view.schema.js';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema.js';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema.js';
import { StoryRating, StoryRatingSchema } from '../story-ratings/schemas/story-rating.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: AuthorRequest.name, schema: AuthorRequestSchema },
      { name: Story.name, schema: StorySchema },
      { name: StoryDailyView.name, schema: StoryDailyViewSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: StoryRating.name, schema: StoryRatingSchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
    AuthModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}

