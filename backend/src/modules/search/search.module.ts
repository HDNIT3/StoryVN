import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { Tag, TagSchema } from '../tags/schemas/tag.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { AuthorProfile, AuthorProfileSchema } from '../users/schemas/author-profile.schema.js';
import { LocalEmbeddingService } from './local-embedding.service.js';
import { SearchEmbedding, SearchEmbeddingSchema } from './search-embedding.schema.js';
import { SearchIndexService } from './search-index.service.js';
import { AdminSearchController, SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({})
export class SearchModule {
  static forRoot(enabled = process.env.SEMANTIC_SEARCH_ENABLED === 'true'): DynamicModule {
    if (!enabled) return { module: SearchModule };
    return {
      module: SearchModule,
      imports: [AuthModule, MongooseModule.forFeature([
        { name: Story.name, schema: StorySchema },
        { name: Genre.name, schema: GenreSchema },
        { name: Tag.name, schema: TagSchema },
        { name: AuthorProfile.name, schema: AuthorProfileSchema },
        { name: SearchEmbedding.name, schema: SearchEmbeddingSchema },
      ])],
      controllers: [SearchController, AdminSearchController],
      providers: [LocalEmbeddingService, SearchIndexService, SearchService],
    };
  }
}
