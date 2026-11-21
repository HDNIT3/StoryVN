import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Story,
  StoryStatus,
} from '../../stories/schemas/story.schema.js';
import { Genre } from '../../genres/schemas/genre.schema.js';
import { Tag } from '../../tags/schemas/tag.schema.js';
import { plainText } from '../utils/search.util.js';
import { GeminiEmbeddingService } from './gemini-embedding.service.js';

type Change =
  { storyId: string } | { field: 'genreIds' | 'tagIds'; id: string };

@Injectable()
export class SearchEmbeddingService {
  private readonly logger = new Logger(SearchEmbeddingService.name);
  private readonly changes: Change[] = [];
  private draining = false;
  private lastWarning = 0;
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    @InjectModel(Genre.name) private readonly genres: Model<Genre>,
    @InjectModel(Tag.name) private readonly tags: Model<Tag>,
    private readonly gemini: GeminiEmbeddingService,
  ) {}

  // Best-effort in-process events only. No startup scan, retry or backfill.
  storyChanged(id: string): void {
    this.enqueue({ storyId: id });
  }
  taxonomyChanged(field: 'genreIds' | 'tagIds', id: string): void {
    this.enqueue({ field, id });
  }

  private enqueue(change: Change): void {
    if (!this.gemini.enabled) return;
    if (this.changes.length >= 64) {
      this.warn('Embedding event queue full; skipped event');
      return;
    }
    this.changes.push(change);
    if (!this.draining) void this.drain();
  }

  private warn(message: string): void {
    if (Date.now() - this.lastWarning > 60_000) {
      this.logger.warn(message);
      this.lastWarning = Date.now();
    }
  }

  private async drain(): Promise<void> {
    this.draining = true;
    try {
      while (this.changes.length) {
        const change = this.changes.shift()!;
        try {
          if ('storyId' in change) await this.updateEmbedding(change.storyId);
          else {
            // Taxonomy events update existing vectors only; old stories are not backfilled.
            const cursor = this.stories
              .find({
                status: StoryStatus.PUBLISHED,
                [change.field]: new Types.ObjectId(change.id),
                'embedding.0': { $exists: true },
              })
              .select('_id')
              .lean()
              .cursor({ batchSize: 20 });
            try {
              for await (const story of cursor)
                await this.updateEmbedding(String(story._id));
            } finally {
              await cursor.close();
            }
          }
        } catch {
          this.warn(
            'Embedding update skipped after failure; business operation remains saved',
          );
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async source(id: string) {
    const story = await this.stories
      .findOne({ _id: id, status: StoryStatus.PUBLISHED })
      .select('title description genreIds tagIds')
      .lean()
      .exec();
    if (!story) return null;
    const [genres, tags] = await Promise.all([
      this.genres
        .find({ _id: { $in: story.genreIds }, isActive: true })
        .select('name')
        .sort({ _id: 1 })
        .lean()
        .exec(),
      this.tags
        .find({ _id: { $in: story.tagIds }, isActive: true })
        .select('name')
        .sort({ _id: 1 })
        .lean()
        .exec(),
    ]);
    const text = `Tên truyện: ${story.title}. Thể loại: ${genres.map((g) => g.name).join(', ')}. Thẻ: ${tags.map((t) => t.name).join(', ')}. Giới thiệu: ${plainText(story.description || '').slice(0, 5000)}`;
    return { story, text };
  }

  private async updateEmbedding(id: string): Promise<void> {
    try {
      const before = await this.source(id);
      if (!before) return;
      const vector = await this.gemini.embed(before.text, 'RETRIEVAL_DOCUMENT');
      const current = await this.source(id);
      if (!current || current.text !== before.text) return;
      // Compare official content again atomically; never touch revisions or updatedAt.
      await this.stories
        .updateOne(
          {
            _id: id,
            status: StoryStatus.PUBLISHED,
            title: before.story.title,
            description: before.story.description,
            genreIds: before.story.genreIds,
            tagIds: before.story.tagIds,
          },
          { $set: { embedding: vector } },
          { timestamps: false },
        )
        .exec();
    } catch {
      this.warn('Gemini embedding failed; kept existing vector, no retry');
    }
  }
}
