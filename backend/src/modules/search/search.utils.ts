import { createHash } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import sanitizeHtml from 'sanitize-html';
import { EMBEDDING_DIMENSIONS, EMBEDDING_PROFILE } from './search.types.js';
import type { SearchCandidate } from './search.types.js';

export function plainText(value: string): string {
  return sanitizeHtml(value.replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|blockquote)>/gi, ' '), {
    allowedTags: [], allowedAttributes: {},
  })
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const point = code.startsWith('x') || code.startsWith('X')
        ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    })
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ').trim();
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function passage(candidate: Pick<SearchCandidate, 'title' | 'description' | 'genres' | 'tags'>): string {
  return `passage: Tên truyện: ${candidate.title}. Thể loại: ${candidate.genres.join(', ')}. Thẻ: ${candidate.tags.join(', ')}. Giới thiệu: ${candidate.description}`.slice(0, 12_000);
}

export function contentHash(text: string): string {
  return createHash('sha256').update(`${EMBEDDING_PROFILE}\n${text}`).digest('hex');
}

export function validVector(vector: unknown): vector is number[] {
  return Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS
    && vector.every((value) => typeof value === 'number' && Number.isFinite(value))
    && vector.some((value) => value !== 0);
}

export function keywordScore(candidate: SearchCandidate, query: string): number {
  const title = normalizeSearch(candidate.title);
  const terms = query.split(' ').filter(Boolean);
  if (!terms.length) return 0;
  const fields: [string, number][] = [
    [title, 5], [normalizeSearch(candidate.tags.join(' ')), 3],
    [normalizeSearch(candidate.genres.join(' ')), 2],
    [normalizeSearch(candidate.description), 1], [normalizeSearch(candidate.author), 3],
  ];
  const overlap = terms.reduce((total, term) => total + fields.reduce(
    (score, [field, weight]) => score + (field.includes(term) ? weight : 0), 0,
  ), 0);
  return overlap + (title === query ? 100 : title.startsWith(query) ? 30 : 0);
}

// Exact, bounded retrieval for the pilot. Yield between chunks so existing APIs
// can keep serving requests; replace this adapter with ANN for a large corpus.
export async function rankCandidates(
  candidates: SearchCandidate[], query: string, queryVector?: number[], limit = 100,
): Promise<string[]> {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];
  const lexical: { id: string; score: number }[] = [];
  const semantic: { id: string; score: number }[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const score = keywordScore(item, normalized);
    if (score > 0) lexical.push({ id: item.id, score });
    if (queryVector && item.vector) {
      let dot = 0;
      for (let d = 0; d < queryVector.length; d++) dot += queryVector[d] * item.vector[d];
      semantic.push({ id: item.id, score: dot });
    }
    if (i > 0 && i % 128 === 0) await setImmediate();
  }
  const order = (a: { id: string; score: number }, b: { id: string; score: number }) =>
    b.score - a.score || a.id.localeCompare(b.id);
  const scores = new Map<string, number>();
  for (const list of [lexical.sort(order), semantic.sort(order)]) {
    list.slice(0, limit).forEach((item, rank) => {
      scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (60 + rank + 1));
    });
  }
  const exact = new Set(candidates.filter((item) => normalizeSearch(item.title) === normalized).map((item) => item.id));
  return [...scores].sort((a, b) => Number(exact.has(b[0])) - Number(exact.has(a[0]))
    || b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([id]) => id);
}

export function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
