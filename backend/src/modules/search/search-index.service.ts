import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Genre } from '../genres/schemas/genre.schema.js';
import { Tag } from '../tags/schemas/tag.schema.js';
import { AuthorProfile } from '../users/schemas/author-profile.schema.js';
import { Story, StoryStatus, StoryVisibility } from '../stories/schemas/story.schema.js';
import { LocalEmbeddingService } from './local-embedding.service.js';
import { SearchEmbedding } from './search-embedding.schema.js';
import { EMBEDDING_PROFILE } from './search.types.js';
import type { SearchCandidate } from './search.types.js';
import { boundedInteger, contentHash, passage, plainText, validVector } from './search.utils.js';

export const PUBLIC_STORIES = {
  status: StoryStatus.PUBLISHED,
  visibility: StoryVisibility.PUBLIC,
};

@Injectable()
export class SearchIndexService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SearchIndexService.name);
  private candidates: SearchCandidate[] = [];
  private running?: Promise<void>;
  private timer?: ReturnType<typeof setInterval>;
  private startup?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private lastCompletedAt: string | null = null;
  private degraded = false;
  private truncated = false;
  private readonly maxStories: number;

  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    @InjectModel(Genre.name) private readonly genres: Model<Genre>,
    @InjectModel(Tag.name) private readonly tags: Model<Tag>,
    @InjectModel(AuthorProfile.name) private readonly authors: Model<AuthorProfile>,
    @InjectModel(SearchEmbedding.name) private readonly embeddings: Model<SearchEmbedding>,
    private readonly local: LocalEmbeddingService,
    private readonly config: ConfigService,
  ) {
    this.maxStories = boundedInteger(config.get('SEARCH_MAX_STORIES'), 2000, 1, 5000);
  }

  onModuleInit(): void {
    // Never hold up application bootstrap, and never run when the module is off.
    this.startup = setTimeout(() => this.startRefresh(), 3000);
    this.startup.unref();
    this.timer = setInterval(() => this.startRefresh(), boundedInteger(
      this.config.get('SEARCH_SYNC_INTERVAL_MS'), 60_000, 30_000, 3_600_000,
    ));
    this.timer.unref();
  }

  onModuleDestroy(): void {
    this.stopped = true;
    clearTimeout(this.startup);
    clearInterval(this.timer);
  }

  snapshot(): SearchCandidate[] {
    return this.candidates.slice();
  }

  status() {
    return {
      running: Boolean(this.running),
      stories: this.candidates.length,
      embedded: this.candidates.filter((item) => item.vector).length,
      maxStories: this.maxStories,
      truncated: this.truncated,
      degraded: this.degraded,
      lastCompletedAt: this.lastCompletedAt,
      profile: EMBEDDING_PROFILE,
    };
  }

  startRefresh(): boolean {
    if (this.running || this.stopped) return false;
    this.running = this.refresh().catch((error: unknown) => {
      this.degraded = true;
      this.logger.error('Search index refresh failed', error instanceof Error ? error.stack : String(error));
    }).finally(() => { this.running = undefined; });
    return true;
  }

  // Used by the admin operation and deterministic tests; no extra job system.
  async waitForRefresh(): Promise<void> {
    await this.running;
  }

  private async refresh(): Promise<void> {
    const records = await this.stories.find(PUBLIC_STORIES)
      .select('_id title description genreIds tagIds authorId')
      .sort({ _id: 1 }).limit(this.maxStories + 1).lean().exec();
    this.truncated = records.length > this.maxStories;
    const selected = records.slice(0, this.maxStories);
    const storyIds = selected.map((story) => story._id);
    const [genres, tags, authors, stored] = await Promise.all([
      this.genres.find({ _id: { $in: selected.flatMap((story) => story.genreIds) }, isActive: true }).select('name').lean().exec(),
      this.tags.find({ _id: { $in: selected.flatMap((story) => story.tagIds) }, isActive: true }).select('name').lean().exec(),
      this.authors.find({ userId: { $in: selected.map((story) => story.authorId) } }).select('userId penName').lean().exec(),
      this.embeddings.find({ storyId: { $in: storyIds }, profile: EMBEDDING_PROFILE }).select('+vector').lean().exec(),
    ]);
    if (this.stopped) return;
    const genreMap = new Map(genres.map((item) => [String(item._id), item.name]));
    const tagMap = new Map(tags.map((item) => [String(item._id), item.name]));
    const authorMap = new Map(authors.map((item) => [String(item.userId), item.penName]));
    const storedMap = new Map(stored.map((item) => [String(item.storyId), item]));
    const next: SearchCandidate[] = selected.map((story) => {
      const candidate: SearchCandidate = {
        id: String(story._id), title: story.title,
        description: plainText(story.description || '').slice(0, 10_000),
        genres: story.genreIds.map((id) => genreMap.get(String(id))).filter((name): name is string => Boolean(name)),
        tags: story.tagIds.map((id) => tagMap.get(String(id))).filter((name): name is string => Boolean(name)),
        author: authorMap.get(String(story.authorId)) || '', contentHash: '',
      };
      candidate.contentHash = contentHash(passage(candidate));
      const cached = storedMap.get(candidate.id);
      if (cached?.contentHash === candidate.contentHash && validVector(cached.vector)) candidate.vector = cached.vector;
      return candidate;
    });
    // Keyword search is usable immediately while new embeddings are built.
    this.candidates = next;
    this.degraded = false;
    for (const candidate of next) {
      if (this.stopped) return;
      if (candidate.vector) continue;
      try {
        const vector = await this.local.embed(passage(candidate));
        if (this.stopped) return;
        if (!validVector(vector)) throw new Error('Invalid document vector');
        await this.embeddings.updateOne(
          { storyId: candidate.id, profile: EMBEDDING_PROFILE },
          { $set: { contentHash: candidate.contentHash, vector } },
          { upsert: true },
        ).exec();
        candidate.vector = vector;
      } catch (error) {
        this.degraded = true;
        this.logger.warn(`Indexing paused; will retry on the next refresh: ${error instanceof Error ? error.message : String(error)}`);
        break;
      }
    }
    // Never clean up beyond the scanned corpus when the pilot limit is reached.
    if (!this.truncated && !this.stopped) {
      await this.embeddings.deleteMany({ profile: EMBEDDING_PROFILE, storyId: { $nin: storyIds } }).exec();
    }
    this.lastCompletedAt = new Date().toISOString();
  }
}
