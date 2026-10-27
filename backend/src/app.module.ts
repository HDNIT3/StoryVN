import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RateLimitGuard } from './common/guards/rate-limit.guard.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { GenresModule } from './modules/genres/genres.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { StoriesModule } from './modules/stories/stories.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ChaptersModule } from './modules/chapters/chapters.module.js';
import { ReadingHistoryModule } from './modules/reading-history/reading-history.module.js';
import { FollowsModule } from './modules/follows/follows.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    RedisModule,
    MailModule,
    UsersModule,
    AuthModule,
    UploadModule,
    GenresModule,
    TagsModule,
    StoriesModule,
    NotificationsModule,
    ChaptersModule,
    ReadingHistoryModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
