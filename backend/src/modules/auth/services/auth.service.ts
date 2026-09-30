import crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  comparePassword,
  hashOtp,
  hashPassword,
} from '../../../common/utils/hash.util.js';
import { MailService } from '../../mail/mail.service.js';
import { RedisService } from '../../redis/redis.service.js';
import {
  UserDocument,
  UserRole,
  UserStatus,
} from '../../users/schemas/user.schema.js';
import { UsersService } from '../../users/services/users.service.js';
import { GoogleLoginDto } from '../dto/google-login.dto.js';
import { OAuth2Client } from 'google-auth-library';
import { ForgotPasswordDto } from '../dto/forgot-password.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { LogoutDto } from '../dto/logout.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { ResendOtpDto } from '../dto/resend-otp.dto.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';
import { VerifyRegisterDto } from '../dto/verify-register.dto.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
    private mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmailOrUsername(
      dto.email,
      dto.username,
    );

    if (existingUser) {
      if (existingUser.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
      }
      throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    const passwordHash = await hashPassword(dto.password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const redisKey = `register:otp:${dto.email.toLowerCase()}`;

    await this.redisService.set(
      redisKey,
      {
        otpHash,
        email: dto.email.toLowerCase(),
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
      },
      300,
    );

    try {
      await this.mailService.sendRegisterOtp(dto.email, dto.displayName, otp);
    } catch {
      await this.redisService.del(redisKey);
      throw new BadRequestException(ErrorCode.MAIL_SENDING_FAILED);
    }

    return {
      success: true,
      message: 'Mã xác thực OTP đã được gửi đến email của bạn',
      data: {},
    };
  }

  async verifyRegister(dto: VerifyRegisterDto) {
    const redisKey = `register:otp:${dto.email.toLowerCase()}`;
    const cached: any = await this.redisService.get(redisKey);

    if (!cached || !cached.otpHash) {
      throw new BadRequestException(ErrorCode.OTP_EXPIRED_OR_NOT_FOUND);
    }

    if (hashOtp(dto.otp) !== cached.otpHash) {
      throw new BadRequestException(ErrorCode.INVALID_OTP);
    }

    const existingUser = await this.usersService.findByEmailOrUsername(
      cached.email,
      cached.username,
    );

    if (existingUser) {
      throw new ConflictException(ErrorCode.USER_ALREADY_EXISTS);
    }

    try {
      const user = await this.usersService.create({
        email: cached.email,
        username: cached.username,
        passwordHash: cached.passwordHash,
        displayName: cached.displayName,
        avatarUrl: null,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        googleId: null,
        versionToken: 0,
      });

      await this.redisService.del(redisKey);

      return {
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            status: user.status,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
          },
        },
      };
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictException(ErrorCode.DUPLICATE_KEY_ERROR);
      }
      throw err;
    }
  }

  async resendOtp(dto: ResendOtpDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    const redisKey = `register:otp:${dto.email.toLowerCase()}`;
    const cached: any = await this.redisService.get(redisKey);

    if (!cached) {
      throw new BadRequestException(ErrorCode.REGISTRATION_NOT_FOUND);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    cached.otpHash = hashOtp(otp);

    await this.redisService.set(redisKey, cached, 300);

    try {
      await this.mailService.sendResendOtp(dto.email, otp);
    } catch {
      throw new BadRequestException(ErrorCode.MAIL_SENDING_FAILED);
    }

    return {
      success: true,
      message: 'Mã OTP mới đã được gửi đến email của bạn',
      data: {},
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(ErrorCode.ACCOUNT_REGISTERED_WITH_GOOGLE);
    }

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const rawToken = dto.token.trim();
    if (!rawToken) {
      throw new BadRequestException(ErrorCode.INVALID_GOOGLE_TOKEN);
    }

    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    let googleUser: {
      googleId: string;
      email: string;
      name?: string;
      picture?: string;
      emailVerified?: boolean;
    };

    try {
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: rawToken,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException(ErrorCode.INVALID_GOOGLE_TOKEN);
      }
      googleUser = {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${rawToken}` },
        });
        if (!res.ok) {
          throw new Error('Userinfo fetch failed');
        }
        const userInfo = await res.json();
        if (!userInfo || !userInfo.email) {
          throw new UnauthorizedException(ErrorCode.INVALID_GOOGLE_TOKEN);
        }
        googleUser = {
          googleId: userInfo.sub,
          email: userInfo.email.toLowerCase(),
          name: userInfo.name,
          picture: userInfo.picture,
          emailVerified: userInfo.email_verified,
        };
      } catch {
        throw new UnauthorizedException(ErrorCode.INVALID_GOOGLE_TOKEN);
      }
    }

    if (googleUser.emailVerified === false) {
      throw new UnauthorizedException(ErrorCode.GOOGLE_EMAIL_NOT_VERIFIED);
    }

    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        user.googleId = googleUser.googleId;
        if (!user.avatarUrl && googleUser.picture) {
          user.avatarUrl = googleUser.picture;
        }

        if (!user.passwordHash) {
          const randomPassword = `Sv@${crypto.randomBytes(4).toString('hex')}`;
          user.passwordHash = await hashPassword(randomPassword);
          this.mailService
            .sendGoogleAccountCreated(
              googleUser.email,
              user.displayName,
              randomPassword,
            )
            .catch(() => {});
        }

        await user.save();
      } else {
        const baseUsername = googleUser.email
          .split('@')[0]
          .replace(/[^a-zA-Z0-9_]/g, '')
          .toLowerCase();
        let username = baseUsername || 'user';
        const existingUsername = await this.usersService.findByUsername(username);
        if (existingUsername) {
          username = `${username}_${crypto.randomBytes(3).toString('hex')}`;
        }

        const randomPassword = `Sv@${crypto.randomBytes(4).toString('hex')}`;
        const passwordHash = await hashPassword(randomPassword);

        user = await this.usersService.create({
          email: googleUser.email,
          username,
          passwordHash,
          displayName: googleUser.name || username,
          avatarUrl: googleUser.picture || null,
          googleId: googleUser.googleId,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          versionToken: 0,
        });

        this.mailService
          .sendGoogleAccountCreated(
            googleUser.email,
            user.displayName,
            randomPassword,
          )
          .catch(() => {});
      }
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }

    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  // ==================== LÀM MỚI TOKEN ====================
  async refreshToken(dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new BadRequestException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'storyvn_refresh_jwt_secret_key_super_secret_2026_auth_service';

    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_EXPIRED);
      }
      throw new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    if (
      (decoded?.tokenType && decoded.tokenType !== 'refresh') ||
      !decoded?.jti
    ) {
      throw new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    const tokenDoc = await this.refreshTokenModel.findOne({ jti: decoded.jti });
    if (!tokenDoc || tokenDoc.revokedAt !== null) {
      throw new UnauthorizedException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    if (tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_EXPIRED);
    }

    const user = await this.usersService.findById(tokenDoc.userId.toString());
    if (!user) {
      throw new UnauthorizedException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }

    // Thu hồi refresh token cũ (Token rotation)
    tokenDoc.revokedAt = new Date();
    await tokenDoc.save();

    // Cấp cặp token mới
    const tokens = await this.generateTokens(user);

    return {
      success: true,
      message: 'Làm mới token thành công',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  // ==================== ĐĂNG XUẤT (1 API DUY NHẤT) ====================
  async logout(
    user: any,
    accessToken: string,
    dto?: LogoutDto,
  ) {
    // 1. Blacklist accessToken vào Redis
    const decoded: any = this.jwtService.decode(accessToken);
    let ttl = 900; // 15 phút mặc định
    if (decoded && decoded.exp) {
      const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
      ttl = remainingSeconds > 0 ? remainingSeconds : 60;
    }
    await this.redisService.set(`blacklist:token:${accessToken}`, '1', ttl);

    // 2. Kiểm tra logout toàn bộ thiết bị hay chỉ thiết bị hiện tại
    if (dto?.allDevices) {
      // Tăng versionToken để vô hiệu hóa toàn bộ accessToken hiện có của user
      await this.usersService.incrementVersionToken(user._id);

      // Thu hồi toàn bộ refreshToken trong DB của user này
      await this.refreshTokenModel.updateMany(
        { userId: user._id, revokedAt: null },
        { revokedAt: new Date() },
      );
    } else {
      // Logout thiết bị hiện tại: nếu có gửi refreshToken thì thu hồi nó trong DB
      if (dto?.refreshToken) {
        let jti: string | undefined;
        try {
          const decoded: any = this.jwtService.decode(dto.refreshToken);
          jti = decoded?.jti;
        } catch {
          // ignore
        }

        if (jti) {
          await this.refreshTokenModel.updateOne(
            { userId: user._id, jti, revokedAt: null },
            { revokedAt: new Date() },
          );
        }
      }
    }

    return {
      success: true,
      message: dto?.allDevices
        ? 'Đăng xuất khỏi tất cả thiết bị thành công'
        : 'Đăng xuất thành công',
      data: {},
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);
    const redisKey = `forgot-password:otp:${dto.email.toLowerCase()}`;

    await this.redisService.set(
      redisKey,
      {
        otpHash,
        email: dto.email.toLowerCase(),
        userId: user._id.toString(),
      },
      300, // 5 phút
    );

    try {
      await this.mailService.sendForgotPasswordOtp(
        user.email,
        user.displayName,
        otp,
      );
    } catch {
      await this.redisService.del(redisKey);
      throw new BadRequestException(ErrorCode.MAIL_SENDING_FAILED);
    }

    return {
      success: true,
      message: 'Mã xác thực OTP đã được gửi đến email của bạn',
      data: {},
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const redisKey = `forgot-password:otp:${dto.email.toLowerCase()}`;
    const cached: any = await this.redisService.get(redisKey);

    if (!cached || !cached.otpHash) {
      throw new BadRequestException(ErrorCode.OTP_EXPIRED_OR_NOT_FOUND);
    }

    if (hashOtp(dto.otp) !== cached.otpHash) {
      throw new BadRequestException(ErrorCode.INVALID_OTP);
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const passwordHash = await hashPassword(dto.newPassword);

    // Cập nhật mật khẩu và tăng versionToken để vô hiệu hóa tất cả phiên đăng nhập cũ
    await this.usersService.updatePasswordHash(user._id, passwordHash);

    // Thu hồi toàn bộ refresh token trong database
    await this.refreshTokenModel.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() },
    );

    // Xóa OTP khỏi Redis
    await this.redisService.del(redisKey);

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại',
      data: {},
    };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      versionToken: user.versionToken || 0,
      jti: crypto.randomUUID(),
    };

    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'storyvn_jwt_secret_key_super_secret_2026_auth_service';
    const accessExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: accessExpiresIn as any,
    });

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'storyvn_refresh_jwt_secret_key_super_secret_2026_auth_service';
    const refreshExpiresIn =
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || '7d';

    const refreshJti = crypto.randomUUID();
    const refreshPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
      jti: refreshJti,
    };

    const rawRefreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    const decodedRefresh: any = this.jwtService.decode(rawRefreshToken);
    const expiresAt = decodedRefresh?.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({
      userId: user._id,
      jti: refreshJti,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
