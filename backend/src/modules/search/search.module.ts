import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { Tag, TagSchema } from '../tags/schemas/tag.schema.js';
import { GeminiEmbeddingService } from './services/gemini-embedding.service.js';
import { SearchService } from './services/search.service.js';
import { SearchEmbeddingService } from './services/search-embedding.service.js';
import { SearchController } from './controllers/search.controller.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: Genre.name, schema: GenreSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [GeminiEmbeddingService, SearchService, SearchEmbeddingService],
  exports: [SearchEmbeddingService],
})
export class SearchModule {}
