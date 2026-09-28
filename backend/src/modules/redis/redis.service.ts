import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    const uri = this.configService.get<string>('REDIS_URI') || 'redis://127.0.0.1:6379';
    this.client = new Redis(uri);
  }


  async set(key: string, value: any, ttl?: number) {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttl) {
      return this.client.set(key, val, 'EX', ttl);
    }
    return this.client.set(key, val);
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data as T;
    }
  }

  async del(key: string | string[]) {
    if (Array.isArray(key)) {
      return this.client.del(...key);
    }
    return this.client.del(key);
  }

  async checkRateLimit(key: string, limit: number, ttlInSeconds: number): Promise<boolean> {
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, ttlInSeconds);
    }
    return current <= limit;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

