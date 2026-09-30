import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisService } from '../../modules/redis/redis.service.js';
import { UserStatus } from '../../modules/users/schemas/user.schema.js';
import { UsersService } from '../../modules/users/services/users.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ErrorCode } from '../enums/error-code.enum.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private redisService: RedisService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    }

    const isBlacklisted = await this.redisService.get(`blacklist:token:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException(ErrorCode.TOKEN_REVOKED);
    }

    // 2. Xác thực JWT token
    let payload: any;
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'storyvn_jwt_secret_key_super_secret_2026_auth_service';
      payload = await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED);
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    }

    if (payload.tokenType && payload.tokenType !== 'access') {
      throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    }

    // 3. Tìm kiếm người dùng trong MongoDB
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
    }

    // 4. Kiểm tra trạng thái tài khoản
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }

    // 5. Kiểm tra versionToken để hỗ trợ logout toàn thiết bị
    if (
      typeof payload.versionToken !== 'undefined' &&
      payload.versionToken !== (user.versionToken || 0)
    ) {
      throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED);
    }

    // Gắn user và token vào request
    (request as any).user = user;
    (request as any).token = token;

    return true;
  }
}
