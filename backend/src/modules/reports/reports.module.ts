import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Chapter, ChapterSchema } from '../chapters/schemas/chapter.schema.js';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema.js';
import { ForumPost, ForumPostSchema } from '../forum/schemas/forum-post.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { AdminReportsController } from './controllers/admin-reports.controller.js';
import { ReportsController } from './controllers/reports.controller.js';
import { ContentReport, ContentReportSchema } from './schemas/content-report.schema.js';
import { ReportsService } from './services/reports.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: ContentReport.name, schema: ContentReportSchema },
      { name: ForumPost.name, schema: ForumPostSchema },
      { name: Story.name, schema: StorySchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
