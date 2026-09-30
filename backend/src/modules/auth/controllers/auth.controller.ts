import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { User } from '../../users/schemas/user.schema.js';
import { ForgotPasswordDto } from '../dto/forgot-password.dto.js';
import { GoogleLoginDto } from '../dto/google-login.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { LogoutDto } from '../dto/logout.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { ResendOtpDto } from '../dto/resend-otp.dto.js';
import { ResetPasswordDto } from '../dto/reset-password.dto.js';
import { VerifyRegisterDto } from '../dto/verify-register.dto.js';
import { AuthService } from '../services/auth.service.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Đăng ký tài khoản mới (gửi mã OTP qua email)' })
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Xác thực mã OTP đăng ký tài khoản' })
  @Post('verify-register')
  @HttpCode(HttpStatus.CREATED)
  async verifyRegister(@Body() dto: VerifyRegisterDto) {
    return this.authService.verifyRegister(dto);
  }

  @ApiOperation({ summary: 'Gửi lại mã OTP đăng ký' })
  @Post('resend-register-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Đăng nhập bằng tài khoản Google' })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @ApiOperation({ summary: 'Lấy accessToken mới bằng refreshToken' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng xuất tài khoản (hỗ trợ logout toàn thiết bị)' })
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: User,
    @Req() req: any,
    @Body() dto?: LogoutDto,
  ) {
    const accessToken = req.token;
    return this.authService.logout(user, accessToken, dto);
  }

  @ApiOperation({ summary: 'Yêu cầu đổi / đặt lại mật khẩu (gửi OTP qua email)' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Đặt lại mật khẩu với mã OTP' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
