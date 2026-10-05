import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoriesController } from './controllers/stories.controller.js';
import { Story, StorySchema } from './schemas/story.schema.js';
import { StoriesService } from './services/stories.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService, MongooseModule],
})
export class StoriesModule {}
