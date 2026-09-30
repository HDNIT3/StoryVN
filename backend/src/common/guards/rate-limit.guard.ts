import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from '../../modules/redis/redis.service.js';
import { ErrorCode } from '../enums/error-code.enum.js';

export const RATE_LIMIT_KEY = 'rate_limit';
export const RateLimit = (limit: number, ttl = 60) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttl });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.originalUrl?.includes('/api/docs')) {
      return true;
    }

    const customLimit = this.reflector.getAllAndOverride<{
      limit: number;
      ttl: number;
    }>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    const limit = customLimit?.limit ?? 60;
    const ttl = customLimit?.ttl ?? 60;

    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip) ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const key = `rate_limit:${ip}:${req.method}:${req.path}`;
    const allowed = await this.redisService.checkRateLimit(key, limit, ttl);

    if (!allowed) {
      throw new HttpException(
        ErrorCode.TOO_MANY_REQUESTS,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
