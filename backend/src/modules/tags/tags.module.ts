import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { TagsController } from './controllers/tags.controller.js';
import { Tag, TagSchema } from './schemas/tag.schema.js';
import { TagsService } from './services/tags.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: Story.name, schema: StorySchema },
    ]),
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService, MongooseModule],
})
export class TagsModule {}
