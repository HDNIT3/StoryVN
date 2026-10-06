/**
 * OptionalAuthGuard: giống AuthGuard nhưng KHÔNG throw lỗi nếu không có token.
 * Nếu có token hợp lệ → gắn user vào request. Nếu không → request.user = null.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisService } from '../../modules/redis/redis.service.js';
import { UserStatus } from '../../modules/users/schemas/user.schema.js';
import { UsersService } from '../../modules/users/services/users.service.js';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      (request as any).user = null;
      return true;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      (request as any).user = null;
      return true;
    }

    try {
      const isBlacklisted = await this.redisService.get(`blacklist:token:${token}`);
      if (isBlacklisted) {
        (request as any).user = null;
        return true;
      }

      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'storyvn_jwt_secret_key_super_secret_2026_auth_service';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload?.sub) {
        const user = await this.usersService.findById(payload.sub);
        if (user && user.status !== UserStatus.BANNED) {
          (request as any).user = user;
          (request as any).token = token;
        } else {
          (request as any).user = null;
        }
      }
    } catch {
      (request as any).user = null;
    }

    return true;
  }
}
