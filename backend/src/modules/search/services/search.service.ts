import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Story,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import { AuthorProfile } from '../../users/schemas/author-profile.schema.js';
import {
  plainText,
  normalizeSearch,
  mergeSearchRanks,
} from '../utils/search.util.js';
import {
  GeminiEmbeddingService,
  VECTOR_DIMENSIONS,
} from './gemini-embedding.service.js';

const VECTOR_INDEX_NAME = 'story_embedding';

const PUBLIC = {
  status: StoryStatus.PUBLISHED,
  visibility: StoryVisibility.PUBLIC,
};
const escapeRegex = (q: string) => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private lastWarning = 0;
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    @InjectModel(AuthorProfile.name)
    private readonly authors: Model<AuthorProfile>,
    private readonly gemini: GeminiEmbeddingService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.gemini.enabled) return;
    try {
      const collection = this.stories.collection;
      const indexes = await collection
        .listSearchIndexes(VECTOR_INDEX_NAME, { maxTimeMS: 5000 })
        .toArray();
      if (indexes.length) return;
      // Atlas builds the index asynchronously. This does not create embeddings.
      await collection.createSearchIndex(
        {
          name: VECTOR_INDEX_NAME,
          type: 'vectorSearch',
          definition: {
            fields: [
              {
                type: 'vector',
                path: 'embedding',
                numDimensions: VECTOR_DIMENSIONS,
                similarity: 'cosine',
              },
              { type: 'filter', path: 'status' },
              { type: 'filter', path: 'visibility' },
            ],
          },
        },
      );
      this.logger.log(
        'Created vector search index; semantic search will work once Atlas reports READY',
      );
    } catch {
      // Unsupported deployments or missing index permissions must not stop approval/API startup.
      this.logger.warn(
        'Cannot initialize vector search index; check MongoDB Vector Search support and index-management permissions',
      );
    }
  }

  private warn(message: string): void {
    if (Date.now() - this.lastWarning > 60_000) {
      this.logger.warn(message);
      this.lastWarning = Date.now();
    }
  }

  private async keyword(q: string) {
    const text = new RegExp(escapeRegex(q), 'i');
    const slug = new RegExp(
      escapeRegex(normalizeSearch(q).replace(/ /g, '-')),
      'i',
    );
    const authors = await this.authors
      .find({ penName: text })
      .select('userId')
      .limit(20)
      .lean()
      .exec();
    const rows = await this.stories
      .aggregate<{ _id: Types.ObjectId; title: string }>([
        {
          $match: {
            ...PUBLIC,
            $or: [
              { title: text },
              { slug },
              { authorId: { $in: authors.map((a) => a.userId) } },
            ],
          },
        },
        // Rank before limiting so a matching title cannot be lost behind older rows.
        {
          $project: {
            _id: 1,
            title: 1,
            rank: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$title',
                        regex: `^${escapeRegex(q)}$`,
                        options: 'i',
                      },
                    },
                    2,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: '$title',
                        regex: `^${escapeRegex(q)}`,
                        options: 'i',
                      },
                    },
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { rank: -1, _id: 1 } },
        { $limit: 40 },
      ])
      .option({ maxTimeMS: 1000 })
      .exec();
    const normalized = normalizeSearch(q);
    const score = (title: string) =>
      normalizeSearch(title) === normalized
        ? 2
        : normalizeSearch(title).startsWith(normalized)
          ? 1
          : 0;
    rows.sort((a, b) => score(b.title) - score(a.title));
    return {
      ids: rows.map((r) => String(r._id)),
      exact: rows.filter((r) => score(r.title) === 2).map((r) => String(r._id)),
    };
  }

  private async semantic(q: string): Promise<string[] | null> {
    if (!this.gemini.enabled) return null;
    try {
      const vector = await this.gemini.query(q);
      const rows = await this.stories
        .aggregate<{ _id: Types.ObjectId }>([
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: vector,
              numCandidates: 400,
              limit: 20,
              filter: PUBLIC,
            },
          },
          { $project: { _id: 1 } },
        ])
        .option({ maxTimeMS: 1000 })
        .exec();
      return rows.map((r) => String(r._id));
    } catch {
      this.warn('Semantic header search unavailable; using keyword');
      return null;
    }
  }

  async suggest(q: string) {
    q = q.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (q.length < 2 || !normalizeSearch(q))
      return { mode: 'keyword', items: [] };
    const [keyword, semantic] = await Promise.all([
      this.keyword(q),
      this.semantic(q),
    ]);
    const ids = mergeSearchRanks(keyword.ids, semantic || [], keyword.exact);
    // Fresh visibility check even when Atlas search index has not caught up yet.
    const rows = await this.stories
      .find({ ...PUBLIC, _id: { $in: ids } })
      .select('_id title slug coverUrl description')
      .lean()
      .exec();
    const byId = new Map(rows.map((row) => [String(row._id), row]));
    return {
      mode: semantic === null ? 'keyword' : 'hybrid',
      items: ids
        .flatMap((id) => {
          const row = byId.get(id);
          return row
            ? [
                {
                  _id: id,
                  title: row.title,
                  slug: row.slug,
                  coverUrl: row.coverUrl || null,
                  description: plainText(row.description || '').slice(0, 140),
                },
              ]
            : [];
        })
        .slice(0, 8),
    };
  }
}
