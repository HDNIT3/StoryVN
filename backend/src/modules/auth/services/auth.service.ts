import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { hashOtp, hashPassword } from '../../../common/utils/hash.util.js';
import { MailService } from '../../mail/mail.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { UserRole, UserStatus } from '../../users/schemas/user.schema.js';
import { UsersService } from '../../users/services/users.service.js';
import { RegisterDto } from '../dto/register.dto.js';
import { ResendOtpDto } from '../dto/resend-otp.dto.js';
import { VerifyRegisterDto } from '../dto/verify-register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

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
}
