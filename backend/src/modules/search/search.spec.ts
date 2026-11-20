import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
import { StoryAgeRating, StoryProgressState } from '../stories/schemas/story.schema.js';
import { LocalEmbeddingService } from './local-embedding.service.js';
import { SearchModule } from './search.module.js';
import { AdminSearchController } from './search.controller.js';
import { PUBLIC_STORIES, SearchIndexService } from './search-index.service.js';
import { SearchQueryDto } from './search-query.dto.js';
import { SearchService } from './search.service.js';
import { EMBEDDING_DIMENSIONS } from './search.types.js';
import type { SearchCandidate } from './search.types.js';
import { contentHash, normalizeSearch, passage, plainText, rankCandidates, validVector } from './search.utils.js';

const storyId = new Types.ObjectId();
const otherId = new Types.ObjectId();
const genreId = new Types.ObjectId();
const tagId = new Types.ObjectId();
const authorId = new Types.ObjectId();
const vector = (axis = 0) => Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => Number(i === axis));
function chain<T>(value: T) {
  const result: any = { exec: vi.fn().mockResolvedValue(value) };
  for (const method of ['select', 'populate', 'sort', 'limit', 'lean']) result[method] = vi.fn().mockReturnValue(result);
  return result;
}
function candidate(overrides: Partial<SearchCandidate> = {}): SearchCandidate {
  return { id: String(storyId), title: 'Cuộc đời thứ hai', description: 'Quay về quá khứ',
    genres: ['Giả tưởng'], tags: ['Trọng sinh'], author: 'Tác giả', contentHash: '', ...overrides };
}
function source() {
  return { _id: storyId, title: 'Cuộc đời thứ hai', description: 'Quay về quá khứ',
    genreIds: [genreId], tagIds: [tagId], authorId,
    // Must never be included in the embedding or the public response.
    revisions: [{ snapshot: { title: 'BẢN CHƯA DUYỆT BÍ MẬT' } }] };
}
function indexHarness(stored: unknown[] = [], genreName = 'Giả tưởng') {
  const stories = { find: vi.fn().mockReturnValue(chain([source()])) };
  const genres = { find: vi.fn().mockReturnValue(chain([{ _id: genreId, name: genreName }])) };
  const tags = { find: vi.fn().mockReturnValue(chain([{ _id: tagId, name: 'Trọng sinh' }])) };
  const authors = { find: vi.fn().mockReturnValue(chain([{ userId: authorId, penName: 'Tác giả' }])) };
  const embeddings = {
    find: vi.fn().mockReturnValue(chain(stored)),
    updateOne: vi.fn().mockReturnValue(chain({})),
    deleteMany: vi.fn().mockReturnValue(chain({})),
  };
  const local = { embed: vi.fn().mockResolvedValue(vector()) };
  const index = new SearchIndexService(stories as any, genres as any, tags as any,
    authors as any, embeddings as any, local as any, new ConfigService());
  return { index, stories, genres, embeddings, local };
}
function searchHarness(entries: SearchCandidate[], live: unknown[] = []) {
  const stories = { find: vi.fn()
    .mockReturnValueOnce(chain(entries.map((item) => ({ _id: new Types.ObjectId(item.id) }))))
    .mockReturnValue(chain(live)) };
  const local = { query: vi.fn().mockResolvedValue(vector()), searchTimeoutMs: 10 };
  const service = new SearchService(stories as any, { snapshot: () => entries } as any, local as any);
  return { service, stories, local };
}

describe('isolated search pilot', () => {
  it('registers no controllers, database models, providers or timers when disabled', () => {
    expect(SearchModule.forRoot(false)).toEqual({ module: SearchModule });
  });

  it('protects index operations with ADMIN role and both auth guards', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminSearchController)).toEqual([UserRole.ADMIN]);
    expect(Reflect.getMetadata('__guards__', AdminSearchController)).toHaveLength(2);
  });

  it('validates and normalizes realtime queries without accepting arbitrary filters', async () => {
    const query = plainToInstance(SearchQueryDto, { q: '  nữ   chính  ', limit: '8' });
    expect(query.q).toBe('nữ chính');
    expect(await validate(query)).toEqual([]);
    for (const values of [{ limit: 21 }, { q: 'x'.repeat(257) }, { genreId: 'bad' }, { limit: -1 }, { q: ['a', 'b'] }]) {
      expect((await validate(plainToInstance(SearchQueryDto, values))).length).toBeGreaterThan(0);
    }
    expect((await validate(plainToInstance(SearchQueryDto, { visibility: 'PRIVATE' }), {
      whitelist: true, forbidNonWhitelisted: true,
    }))).not.toEqual([]);
  });
});

describe('local retrieval', () => {
  it('folds Vietnamese accents only for keyword search and removes HTML/script', () => {
    expect(normalizeSearch('NỮ CHÍNH ĐIỀU TRA')).toBe('nu chinh dieu tra');
    expect(plainText('<p>Nữ chính &amp; đồng đội</p><script>secret()</script>')).toBe('Nữ chính & đồng đội');
    expect(plainText('<p>Nữ chính</p><p>trọng sinh</p>')).toBe('Nữ chính trọng sinh');
    expect(passage(candidate())).toContain('Thẻ: Trọng sinh');
    expect(passage(candidate())).toContain('passage: ');
  });

  it('combines semantic synonyms and keyword matches, pinning an exact title', async () => {
    const exact = candidate({ title: 'Nữ chính', vector: vector(1) });
    const synonym = candidate({ id: String(otherId), title: 'Hành trình', description: 'Phiêu lưu', genres: [], tags: [], author: '', vector: vector() });
    const results = await rankCandidates([synonym, exact], 'nu chinh', vector());
    expect(results).toEqual([String(storyId), String(otherId)]);
    expect(await rankCandidates([synonym], 'nữ chính')).toEqual([]);
  });

  it('does not accept malformed, zero or nonfinite persisted vectors', () => {
    expect(validVector(vector())).toBe(true);
    expect(validVector([1])).toBe(false);
    expect(validVector(Array.from({ length: 384 }, () => 0))).toBe(false);
    const broken = vector(); broken[1] = Number.NaN;
    expect(validVector(broken)).toBe(false);
  });

  it('coalesces repeated query embeddings and preserves Vietnamese input', async () => {
    const local = new LocalEmbeddingService(new ConfigService());
    const embed = vi.spyOn(local, 'embed').mockResolvedValue(vector());
    await Promise.all([local.query(' Nữ   chính '), local.query('nữ chính')]);
    expect(embed).toHaveBeenCalledExactlyOnceWith('query: nữ chính');
  });

  it('evicts failed query embeddings so later searches can recover', async () => {
    const local = new LocalEmbeddingService(new ConfigService());
    const embed = vi.spyOn(local, 'embed').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(vector());
    await expect(local.query('trọng sinh')).rejects.toThrow('offline');
    await expect(local.query('trọng sinh')).resolves.toEqual(vector());
    expect(embed).toHaveBeenCalledTimes(2);
  });
});

describe('derived index synchronization', () => {
  it('embeds only official content and writes exclusively to the derived collection', async () => {
    const { index, stories, embeddings, local } = indexHarness();
    index.startRefresh();
    await index.waitForRefresh();
    expect(stories.find).toHaveBeenCalledWith(PUBLIC_STORIES);
    const text = local.embed.mock.calls[0][0];
    expect(text).toContain('Thể loại: Giả tưởng');
    expect(text).toContain('Thẻ: Trọng sinh');
    expect(text).not.toContain('BẢN CHƯA DUYỆT');
    expect(embeddings.updateOne).toHaveBeenCalledTimes(1);
    expect(index.status()).toMatchObject({ running: false, stories: 1, embedded: 1, degraded: false });
  });

  it('reuses valid persisted vectors when content is unchanged, including after restart', async () => {
    const hash = contentHash(passage(candidate()));
    const { index, local, embeddings } = indexHarness([{ storyId, contentHash: hash, vector: vector() }]);
    index.startRefresh(); await index.waitForRefresh();
    expect(local.embed).not.toHaveBeenCalled();
    expect(embeddings.updateOne).not.toHaveBeenCalled();
    expect(index.snapshot()[0].vector).toEqual(vector());
  });

  it('re-embeds when a referenced genre is renamed even without changing the story timestamp', async () => {
    const hash = contentHash(passage(candidate()));
    const { index, local } = indexHarness([{ storyId, contentHash: hash, vector: vector() }], 'Khoa học viễn tưởng');
    index.startRefresh(); await index.waitForRefresh();
    expect(local.embed).toHaveBeenCalledTimes(1);
    expect(local.embed.mock.calls[0][0]).toContain('Khoa học viễn tưởng');
  });

  it('does not overlap refreshes and keeps keyword data when embedding is unavailable', async () => {
    const { index, local } = indexHarness();
    local.embed.mockRejectedValue(new Error('offline'));
    expect(index.startRefresh()).toBe(true);
    expect(index.startRefresh()).toBe(false);
    await index.waitForRefresh();
    expect(index.snapshot()).toHaveLength(1);
    expect(index.status()).toMatchObject({ degraded: true, embedded: 0 });
  });

  it('reports corpus truncation and does not delete embeddings outside the scan limit', async () => {
    const { index, stories, embeddings } = indexHarness();
    stories.find.mockReturnValue(chain(Array.from({ length: 2001 }, () => source())));
    // Reusing cached vectors also keeps this test independent of model inference.
    embeddings.find.mockReturnValue(chain([{ storyId, contentHash: contentHash(passage(candidate())), vector: vector() }]));
    index.startRefresh(); await index.waitForRefresh();
    expect(index.status().truncated).toBe(true);
    expect(index.snapshot()).toHaveLength(2000);
    expect(embeddings.deleteMany).not.toHaveBeenCalled();
  });
});

describe('public realtime search', () => {
  it('does not query a model or database for an empty, one-character or punctuation-only query', async () => {
    const { service, stories, local } = searchHarness([]);
    for (const q of ['', 'n', '.*']) {
      expect((await service.suggest(Object.assign(new SearchQueryDto(), { q }))).items).toEqual([]);
    }
    expect(stories.find).not.toHaveBeenCalled();
    expect(local.query).not.toHaveBeenCalled();
  });

  it('returns canonical public fields rather than cached descriptions or revisions', async () => {
    const { service, stories } = searchHarness([candidate({ vector: vector(), description: 'STALE SECRET' })], [
      { ...source(), slug: 'cuoc-doi', coverUrl: null, progressState: 'COMPLETED', ageRating: 'ALL',
        description: '<p>Giới thiệu đang công khai</p>', genreIds: [{ _id: genreId, name: 'Giả tưởng', slug: 'gia-tuong', isActive: true }], tagIds: [] },
    ]);
    const result = await service.suggest(Object.assign(new SearchQueryDto(), { q: 'trọng sinh' }));
    expect(result.mode).toBe('hybrid');
    expect(result.items[0]).toMatchObject({ title: 'Cuộc đời thứ hai', description: 'Giới thiệu đang công khai' });
    expect(JSON.stringify(result)).not.toMatch(/STALE SECRET|BẢN CHƯA DUYỆT|vector|contentHash/);
    for (const [filter] of stories.find.mock.calls) expect(filter).toMatchObject(PUBLIC_STORIES);
  });

  it('removes a story hidden during inference before returning a response', async () => {
    const { service, local } = searchHarness([candidate({ vector: vector() })], []);
    const result = await service.suggest(Object.assign(new SearchQueryDto(), { q: 'trọng sinh' }));
    expect(local.query).toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });

  it('applies fresh taxonomy, progress and age filters before top-k and again after inference', async () => {
    const { service, stories } = searchHarness([candidate({ vector: vector() })]);
    await service.suggest(Object.assign(new SearchQueryDto(), { q: 'trọng sinh', genreId: String(genreId),
      tagId: String(tagId), progressState: StoryProgressState.COMPLETED, ageRating: StoryAgeRating.ALL }));
    for (const [filter] of stories.find.mock.calls) expect(filter).toMatchObject({
      ...PUBLIC_STORIES, genreIds: genreId, tagIds: tagId, progressState: 'COMPLETED', ageRating: 'ALL',
    });
  });

  it('falls back to keyword ranking when the worker fails or misses the realtime deadline', async () => {
    for (const implementation of [() => Promise.reject(new Error('offline')), () => new Promise<number[]>(() => {})]) {
      const { service, local } = searchHarness([candidate({ vector: vector() })], [
        { ...source(), slug: 'cuoc-doi', genreIds: [], tagIds: [] },
      ]);
      local.query.mockImplementation(implementation);
      const result = await service.suggest(Object.assign(new SearchQueryDto(), { q: 'cuộc đời' }));
      expect(result.mode).toBe('keyword');
      expect(result.items).toHaveLength(1);
    }
  });

  it('escapes user regex metacharacters during cold-start keyword fallback', async () => {
    const { service, stories, local } = searchHarness([]);
    stories.find.mockReset().mockReturnValue(chain([]));
    await service.suggest(Object.assign(new SearchQueryDto(), { q: 'nữ (chính)+' }));
    expect(stories.find.mock.calls[0][0].$or[0].title.source).toBe('nữ \\(chính\\)\\+');
    expect(local.query).not.toHaveBeenCalled();
  });
});
