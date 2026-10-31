import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { GenresController } from './controllers/genres.controller.js';
import { Genre, GenreSchema } from './schemas/genre.schema.js';
import { GenresService } from './services/genres.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Genre.name, schema: GenreSchema },
      { name: Story.name, schema: StorySchema },
    ]),
  ],
  controllers: [GenresController],
  providers: [GenresService],
  exports: [GenresService, MongooseModule],
})
export class GenresModule {}
