import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { AdminForumController } from './controllers/admin-forum.controller.js';
import { ForumController } from './controllers/forum.controller.js';
import { ReportsModule } from '../reports/reports.module.js';
import { ForumPost, ForumPostSchema } from './schemas/forum-post.schema.js';
import { ForumService } from './services/forum.service.js';

@Module({
  imports: [
    AuthModule,
    ReportsModule,
    MongooseModule.forFeature([
      { name: ForumPost.name, schema: ForumPostSchema },
    ]),
  ],
  controllers: [ForumController, AdminForumController],
  providers: [ForumService],
})
export class ForumModule {}
