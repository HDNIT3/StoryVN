import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const VECTOR_DIMENSIONS = 768;

@Injectable()
export class GeminiEmbeddingService {
  private active = 0;
  private readonly cache = new Map<
    string,
    { expires: number; value: Promise<number[]> }
  >();
  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return Boolean(this.config.get<string>('GEMINI_API_KEY')?.trim());
  }

  query(text: string): Promise<number[]> {
    const key = text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = this.embed(key, 'RETRIEVAL_QUERY');
    this.cache.delete(key);
    this.cache.set(key, { expires: Date.now() + 300_000, value });
    if (this.cache.size > 100)
      this.cache.delete(this.cache.keys().next().value!);
    void value.catch(() => {
      if (this.cache.get(key)?.value === value) this.cache.delete(key);
    });
    return value;
  }

  async embed(
    text: string,
    taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT',
  ): Promise<number[]> {
    if (!this.enabled || this.active >= 3)
      throw new Error('Embedding unavailable');
    const model =
      this.config.get<string>('GEMINI_EMBEDDING_MODEL') ||
      'gemini-embedding-001';
    if (!/^[a-zA-Z0-9._-]+$/.test(model))
      throw new Error('Invalid embedding model');
    this.active++;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.config.get<string>('GEMINI_API_KEY')!.trim(),
          },
          signal: AbortSignal.timeout(
            taskType === 'RETRIEVAL_QUERY' ? 1800 : 10_000,
          ),
          body: JSON.stringify({
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: VECTOR_DIMENSIONS,
          }),
        },
      );
      // Do not log response bodies: provider errors may contain submitted content.
      if (!response.ok) throw new Error(`Embedding HTTP ${response.status}`);
      const data = (await response.json()) as {
        embedding?: { values?: number[] };
      };
      const vector = data.embedding?.values;
      if (
        !Array.isArray(vector) ||
        vector.length !== VECTOR_DIMENSIONS ||
        !vector.every(Number.isFinite)
      ) {
        throw new Error('Invalid embedding vector');
      }
      const norm = Math.hypot(...vector);
      if (!norm) throw new Error('Zero embedding vector');
      return vector.map((value) => value / norm);
    } finally {
      this.active--;
    }
  }
}
