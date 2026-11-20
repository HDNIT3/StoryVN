import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story } from '../stories/schemas/story.schema.js';
import { LocalEmbeddingService } from './local-embedding.service.js';
import { PUBLIC_STORIES, SearchIndexService } from './search-index.service.js';
import { SearchQueryDto } from './search-query.dto.js';
import { normalizeSearch, plainText, rankCandidates } from './search.utils.js';

async function deadline<T>(promise: Promise<T>, timeout: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Search deadline')), timeout); }),
    ]);
  } finally { clearTimeout(timer); }
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    private readonly index: SearchIndexService,
    private readonly local: LocalEmbeddingService,
  ) {}

  async suggest(query: SearchQueryDto, maximum = 8) {
    const q = (query.q || '').trim();
    const limit = Math.min(query.limit, maximum);
    let mode: 'hybrid' | 'keyword' = 'keyword';
    if (q.length < 2 || !normalizeSearch(q)) return { query: q, mode, items: [], hasMore: false };
    const filter: Record<string, unknown> = { ...PUBLIC_STORIES };
    if (query.genreId) filter.genreIds = new Types.ObjectId(query.genreId);
    if (query.tagId) filter.tagIds = new Types.ObjectId(query.tagId);
    if (query.progressState) filter.progressState = query.progressState;
    if (query.ageRating) filter.ageRating = query.ageRating;

    const snapshot = this.index.snapshot();
    let rankedIds: string[];
    if (snapshot.length) {
      // Apply fresh visibility and user filters BEFORE top-k, including cache hits.
      const allowed = await this.stories.find({ ...filter, _id: { $in: snapshot.map((item) => new Types.ObjectId(item.id)) } })
        .select('_id').lean().exec();
      const allowedIds = new Set(allowed.map((item) => String(item._id)));
      const candidates = snapshot.filter((item) => allowedIds.has(item.id));
      let vector: number[] | undefined;
      if (candidates.some((item) => item.vector)) {
        try {
          vector = await deadline(this.local.query(q), this.local.searchTimeoutMs);
          mode = 'hybrid';
        } catch { /* Cold model, overload or offline: keep keyword results usable. */ }
      }
      rankedIds = await rankCandidates(candidates, q, vector);
    } else {
      // During the initial scan, offer a small read-only title/description fallback.
      // All regular expression metacharacters are literal user input.
      const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const text = new RegExp(escape(q), 'i');
      const slug = new RegExp(escape(normalizeSearch(q).replace(/ /g, '-')), 'i');
      const matches = await this.stories.find({ ...filter, $or: [{ title: text }, { slug }, { description: text }] })
        .select('_id').sort({ _id: 1 }).limit(100).lean().exec();
      rankedIds = matches.map((item) => String(item._id));
    }
    if (!rankedIds.length) return { query: q, mode, items: [], hasMore: false };
    // Revalidate after inference too: a story may have been hidden while waiting.
    // Do not return any stored title, snippet or vector from the search snapshot.
    const current = await this.stories.find({ ...filter, _id: { $in: rankedIds.map((id) => new Types.ObjectId(id)) } })
      .select('_id title slug coverUrl description progressState ageRating genreIds tagIds')
      .populate('genreIds', 'name slug isActive').populate('tagIds', 'name slug isActive')
      .lean().exec();
    const map = new Map(current.map((item) => [String(item._id), item]));
    const ordered = rankedIds.map((id) => map.get(id)).filter((item) => item !== undefined);
    const taxonomy = (items: unknown[]) => items.filter((item): item is { _id: unknown; name: string; slug: string; isActive?: boolean } =>
      Boolean(item && typeof item === 'object' && 'name' in item && (!('isActive' in item) || item.isActive !== false)))
      .map((item) => ({ _id: String(item._id), name: item.name, slug: item.slug }));
    return {
      query: q, mode,
      items: ordered.slice(0, limit).map((story) => ({
        _id: String(story._id), title: story.title, slug: story.slug,
        coverUrl: story.coverUrl || null,
        description: plainText(story.description || '').slice(0, 240),
        progressState: story.progressState, ageRating: story.ageRating,
        genres: taxonomy(story.genreIds), tags: taxonomy(story.tagIds),
      })),
      hasMore: ordered.length > limit,
    };
  }
}
