import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import type { EmbeddingReply } from './search.types.js';
import { boundedInteger, validVector } from './search.utils.js';

@Injectable()
export class LocalEmbeddingService implements OnModuleDestroy {
  private readonly logger = new Logger(LocalEmbeddingService.name);
  private worker?: Worker;
  private sequence = 0;
  private stopped = false;
  private readonly pending = new Map<number, {
    resolve: (vector: number[]) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private readonly queries = new Map<string, { expires: number; promise: Promise<number[]> }>();

  constructor(private readonly config: ConfigService) {}

  query(text: string): Promise<number[]> {
    // Preserve accents for the model. Accent folding is only for lexical search.
    const key = text.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    const cached = this.queries.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const promise = this.embed(`query: ${key}`);
    this.queries.delete(key);
    this.queries.set(key, { expires: Date.now() + 5 * 60_000, promise });
    if (this.queries.size > 100) this.queries.delete(this.queries.keys().next().value!);
    void promise.catch(() => {
      if (this.queries.get(key)?.promise === promise) this.queries.delete(key);
    });
    return promise;
  }

  embed(text: string): Promise<number[]> {
    if (this.stopped) return Promise.reject(new Error('Embedding worker stopped'));
    // Includes jobs whose HTTP caller already fell back, until the worker replies.
    if (this.pending.size >= 8) return Promise.reject(new Error('Embedding queue is full'));
    const worker = this.getWorker();
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.worker === worker) {
          this.failWorker(worker, new Error('Embedding worker timed out'));
          void worker.terminate();
        }
      }, 180_000);
      timer.unref();
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, text });
    });
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL('./embedding.worker.js', import.meta.url), {
      workerData: {
        cacheDir: resolve(this.config.get<string>('SEARCH_MODEL_CACHE_DIR') || '.cache/semantic-search'),
        allowRemoteModels: this.config.get<string>('SEARCH_ALLOW_MODEL_DOWNLOAD') === 'true',
      },
    });
    this.worker = worker;
    worker.on('message', (reply: EmbeddingReply) => {
      const job = this.pending.get(reply.id);
      if (!job) return;
      clearTimeout(job.timer);
      this.pending.delete(reply.id);
      if (reply.error || !validVector(reply.vector)) {
        this.logger.warn('Local embedding unavailable; search can fall back to keywords.');
        job.reject(new Error(reply.error || 'Invalid embedding vector'));
      } else job.resolve(reply.vector);
    });
    worker.on('error', (error) => this.failWorker(worker, error));
    worker.on('exit', () => this.failWorker(worker, new Error('Embedding worker exited')));
    return worker;
  }

  private failWorker(worker: Worker, error: Error): void {
    if (this.worker !== worker) return;
    this.worker = undefined;
    this.queries.clear();
    for (const job of this.pending.values()) {
      clearTimeout(job.timer);
      job.reject(error);
    }
    this.pending.clear();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopped = true;
    const worker = this.worker;
    if (worker) {
      this.failWorker(worker, new Error('Embedding worker stopped'));
      await worker.terminate();
    }
  }

  get searchTimeoutMs(): number {
    return boundedInteger(this.config.get('SEARCH_QUERY_TIMEOUT_MS'), 1200, 100, 10_000);
  }
}
