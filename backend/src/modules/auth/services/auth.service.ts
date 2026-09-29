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

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_BANNED);
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_SUSPENDED);
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

    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');

    const tokenDoc = await this.refreshTokenModel.findOne({ tokenHash });
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
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_SUSPENDED);
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
        const tokenHash = crypto
          .createHash('sha256')
          .update(dto.refreshToken)
          .digest('hex');

        await this.refreshTokenModel.updateOne(
          { userId: user._id, tokenHash, revokedAt: null },
          { revokedAt: new Date() },
        );
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
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(ErrorCode.ACCOUNT_SUSPENDED);
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

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    // 7 ngày hết hạn cho refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash,
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
