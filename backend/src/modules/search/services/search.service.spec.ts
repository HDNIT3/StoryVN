import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import {
  GeminiEmbeddingService,
  VECTOR_DIMENSIONS,
} from './gemini-embedding.service.js';
import { SearchService } from './search.service.js';
import { SearchEmbeddingService } from './search-embedding.service.js';
import { mergeSearchRanks } from '../utils/search.util.js';
import {
  StorySchema,
  StoryStatus,
  StoryVisibility,
} from '../../stories/schemas/story.schema.js';
import { AdminStoriesService } from '../../stories/services/admin-stories.service.js';
import { GenresService } from '../../genres/services/genres.service.js';
import { TagsService } from '../../tags/services/tags.service.js';

const id = new Types.ObjectId();
const vector = Array.from({ length: VECTOR_DIMENSIONS }, (_, i) =>
  Number(i === 0),
);
const official = {
  _id: id,
  title: 'Cuộc đời thứ hai',
  description: '<p>Quay về quá khứ</p>',
  genreIds: [],
  tagIds: [],
};
function chain(value: unknown) {
  const result: any = { exec: vi.fn().mockResolvedValue(value) };
  for (const key of ['select', 'sort', 'lean', 'limit', 'option'])
    result[key] = vi.fn().mockReturnValue(result);
  return result;
}
function harness(enabled = true) {
  const stories = {
    collection: {
      name: 'stories',
      listSearchIndexes: vi
        .fn()
        .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      createSearchIndex: vi.fn().mockResolvedValue('story_embedding'),
    },
    findOne: vi.fn().mockReturnValue(chain(official)),
    find: vi.fn().mockReturnValue(chain([])),
    updateOne: vi.fn().mockReturnValue(chain({})),
    aggregate: vi.fn().mockReturnValue(chain([])),
  };
  const taxonomy = { find: vi.fn().mockReturnValue(chain([])) };
  const gemini = {
    enabled,
    embed: vi.fn().mockResolvedValue(vector),
    query: vi.fn().mockResolvedValue(vector),
  };
  const service = new SearchEmbeddingService(
    stories as any,
    taxonomy as any,
    taxonomy as any,
    gemini as any,
  );
  const search = new SearchService(
    stories as any,
    taxonomy as any,
    taxonomy as any,
    gemini as any,
  );
  return { service, search, stories, taxonomy, gemini };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('vector index initialization', () => {
  it('creates a missing index without creating embeddings or modifying stories', async () => {
    const { search, stories, gemini } = harness();
    await search.onModuleInit();
    expect(stories.collection.createSearchIndex).toHaveBeenCalledWith(
      {
        name: 'story_embedding',
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 768,
              similarity: 'cosine',
            },
            { type: 'filter', path: 'status' },
            { type: 'filter', path: 'visibility' },
          ],
        },
      },
    );
    expect(gemini.embed).not.toHaveBeenCalled();
    expect(gemini.query).not.toHaveBeenCalled();
    expect(stories.updateOne).not.toHaveBeenCalled();
  });

  it('leaves an existing index unchanged', async () => {
    const { search, stories } = harness();
    stories.collection.listSearchIndexes.mockReturnValue({
      toArray: vi
        .fn()
        .mockResolvedValue([{ name: 'story_embedding', queryable: true }]),
    });
    await search.onModuleInit();
    expect(stories.collection.createSearchIndex).not.toHaveBeenCalled();
  });

  it('does not inspect or create an index when the Gemini key is empty', async () => {
    const { search, stories } = harness(false);
    await search.onModuleInit();
    expect(stories.collection.listSearchIndexes).not.toHaveBeenCalled();
    expect(stories.collection.createSearchIndex).not.toHaveBeenCalled();
  });

  it('does not fail startup if index creation is denied', async () => {
    const { search, stories } = harness();
    stories.collection.createSearchIndex.mockRejectedValue(
      new Error('Forbidden'),
    );
    await expect(search.onModuleInit()).resolves.toBeUndefined();
  });
});

describe('Gemini embedding client', () => {
  it('sends document/query task type, validates dimensions and coalesces queries', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: { values: vector } }),
    });
    vi.stubGlobal('fetch', fetcher);
    const client = new GeminiEmbeddingService(
      new ConfigService({ GEMINI_API_KEY: 'test' }),
    );
    const [a, b] = await Promise.all([
      client.query(' Nữ   chính '),
      client.query('nữ chính'),
    ]);
    expect(a).toEqual(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
      content: { parts: [{ text: 'nữ chính' }] },
    });
    await client.embed('Giới thiệu', 'RETRIEVAL_DOCUMENT');
    expect(JSON.parse(fetcher.mock.calls[1][1].body).taskType).toBe(
      'RETRIEVAL_DOCUMENT',
    );
  });

  it('does not retry errors or retain rejected promises in the query cache', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    vi.stubGlobal('fetch', fetcher);
    const client = new GeminiEmbeddingService(
      new ConfigService({ GEMINI_API_KEY: 'test' }),
    );
    await expect(client.query('trọng sinh')).rejects.toThrow('429');
    await expect(client.query('trọng sinh')).rejects.toThrow('429');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed vectors and never calls provider without a key', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: { values: [1] } }),
    });
    vi.stubGlobal('fetch', fetcher);
    await expect(
      new GeminiEmbeddingService(new ConfigService()).query('truyện'),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    await expect(
      new GeminiEmbeddingService(
        new ConfigService({ GEMINI_API_KEY: 'test' }),
      ).query('truyện'),
    ).rejects.toThrow('Invalid');
  });
});

describe('embedding events', () => {
  it('has no startup backfill and ignores events without a key', async () => {
    const { service, stories, gemini } = harness(false);
    service.storyChanged(String(id));
    expect(stories.findOne).not.toHaveBeenCalled();
    expect(gemini.embed).not.toHaveBeenCalled();
    expect(StorySchema.path('embedding').options.select).toBe(false);
    expect(StorySchema.path('embedding').options.default).toBeUndefined();
  });

  it('writes only embedding from official content without changing story timestamps', async () => {
    const { service, stories, gemini } = harness();
    service.storyChanged(String(id));
    await vi.waitFor(() => expect(stories.updateOne).toHaveBeenCalledTimes(1));
    expect(gemini.embed.mock.calls[0][0]).toContain(
      'Giới thiệu: Quay về quá khứ',
    );
    expect(gemini.embed.mock.calls[0][0]).not.toContain('<p>');
    expect(stories.updateOne.mock.calls[0][1]).toEqual({
      $set: { embedding: vector },
    });
    expect(stories.updateOne.mock.calls[0][2]).toEqual({ timestamps: false });
    expect(stories.findOne.mock.calls[0][0].status).toBe('PUBLISHED');
  });

  it('skips failed or superseded embedding writes without retry', async () => {
    const { service, stories, gemini } = harness();
    gemini.embed.mockRejectedValueOnce(new Error('429'));
    service.storyChanged(String(id));
    await vi.waitFor(() => expect((service as any).draining).toBe(false));
    expect(gemini.embed).toHaveBeenCalledTimes(1);
    expect(stories.updateOne).not.toHaveBeenCalled();
    stories.findOne
      .mockReturnValueOnce(chain(official))
      .mockReturnValueOnce(chain({ ...official, title: 'Changed' }));
    service.storyChanged(String(id));
    await vi.waitFor(() => expect((service as any).draining).toBe(false));
    expect(stories.updateOne).not.toHaveBeenCalled();
  });

  it('taxonomy events stream only previously embedded stories', async () => {
    const { service, stories } = harness();
    const close = vi.fn();
    const cursor = {
      async *[Symbol.asyncIterator]() {
        yield { _id: id };
      },
      close,
    };
    const query = chain([]);
    query.cursor = () => cursor;
    stories.find.mockReturnValue(query);
    service.taxonomyChanged('tagIds', String(id));
    await vi.waitFor(() => expect(close).toHaveBeenCalled());
    expect(stories.find.mock.calls[0][0]).toMatchObject({
      'embedding.0': { $exists: true },
      tagIds: id,
    });
  });

  it.each(['genre', 'tag'])(
    'emits a %s update only after saving changed embedding inputs',
    async (kind) => {
      const taxonomy = {
        name: 'Old',
        isActive: true,
        save: vi.fn().mockResolvedValue({}),
      };
      const model = {
        findById: vi.fn().mockResolvedValue(taxonomy),
        findOne: vi.fn().mockResolvedValue(null),
      };
      const events = { taxonomyChanged: vi.fn() };
      const service =
        kind === 'genre'
          ? new GenresService(model as any, {} as any, events as any)
          : new TagsService(model as any, {} as any, events as any);
      await service.update(String(id), { isActive: false });
      expect(events.taxonomyChanged).toHaveBeenCalledWith(
        `${kind}Ids`,
        String(id),
      );
      expect(taxonomy.save.mock.invocationCallOrder[0]).toBeLessThan(
        events.taxonomyChanged.mock.invocationCallOrder[0],
      );
    },
  );

  it('approval succeeds while the asynchronous Gemini job fails', async () => {
    const { service: search, gemini } = harness();
    gemini.embed.mockRejectedValue(new Error('provider unavailable'));
    const story = {
      ...official,
      authorId: id,
      status: StoryStatus.PENDING_REVIEW,
      visibility: StoryVisibility.PRIVATE,
      revisions: [],
      save: vi.fn().mockResolvedValue(undefined),
    };
    const model = { findById: () => ({ select: async () => story }) };
    const admin = new AdminStoriesService(
      model as any,
      {} as any,
      {} as any,
      { create: vi.fn().mockResolvedValue({}) } as any,
      undefined,
      undefined,
      search,
    );
    vi.spyOn(admin, 'findById').mockResolvedValue({} as any);
    await expect(
      admin.approveStory(String(id), String(id)),
    ).resolves.toBeDefined();
    await vi.waitFor(() => expect((search as any).draining).toBe(false));
    expect(story.status).toBe(StoryStatus.PUBLISHED);
    expect(story.save).toHaveBeenCalledOnce();
  });
});

describe('search suggestions', () => {
  it('fuses lists without duplicate IDs and pins exact titles', () => {
    expect(
      mergeSearchRanks(['exact', 'both'], ['semantic', 'both'], ['exact']),
    ).toEqual(['exact', 'both', 'semantic']);
  });
  it('falls back when Atlas is unavailable and revalidates public visibility', async () => {
    const { search, stories } = harness();
    stories.aggregate
      .mockReturnValueOnce({
        option: () => ({
          exec: () => Promise.reject(new Error('missing vector index')),
        }),
      } as any)
      .mockReturnValueOnce(chain([{ _id: id, title: official.title }]));
    stories.find.mockReturnValue(
      chain([{ ...official, slug: 'cuoc-doi-thu-hai' }]),
    );
    const result = await search.suggest('Cuộc đời');
    expect(result.mode).toBe('keyword');
    expect(result.items[0].slug).toBe('cuoc-doi-thu-hai');
    expect(stories.find.mock.calls[0][0]).toMatchObject({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    });
    expect(result.items[0]).not.toHaveProperty('embedding');
    expect(result.items[0]).not.toHaveProperty('revisions');
  });

  it('combines vector results with keyword matches on the four story fields', async () => {
    const { search, stories, taxonomy } = harness();
    const genreId = new Types.ObjectId();
    const tagId = new Types.ObjectId();
    const vectorStoryId = new Types.ObjectId();
    taxonomy.find
      .mockReturnValueOnce(chain([{ _id: genreId }]))
      .mockReturnValueOnce(chain([{ _id: tagId }]));
    stories.aggregate
      .mockReturnValueOnce(chain([{ _id: vectorStoryId }, { _id: id }]))
      .mockReturnValueOnce(chain([{ _id: id, title: official.title }]));
    stories.find.mockReturnValue(
      chain([
        { ...official, slug: 'cuoc-doi-thu-hai' },
        { ...official, _id: vectorStoryId, slug: 'mot-the-gioi-moi' },
      ]),
    );

    const result = await search.suggest('Truyện về phiêu lưu');
    const matches = {
      $regex: expect.stringContaining('phiêu'),
      $options: 'i',
    };
    expect(taxonomy.find).toHaveBeenCalledWith({
      name: matches,
      isActive: true,
    });
    expect(stories.aggregate.mock.calls[1][0][0].$match).toEqual({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      $or: [
        { title: matches },
        { description: matches },
        { genreIds: { $in: [genreId] } },
        { tagIds: { $in: [tagId] } },
      ],
    });
    expect(result.mode).toBe('hybrid');
    expect(result.items.map((item) => item.slug)).toEqual([
      'cuoc-doi-thu-hai',
      'mot-the-gioi-moi',
    ]);
  });
});
