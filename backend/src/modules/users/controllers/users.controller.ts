import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { UpdateAvatarDto } from '../dto/update-avatar.dto.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { User } from '../schemas/user.schema.js';
import { UsersService } from '../services/users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Lấy thông tin hồ sơ cá nhân' })
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: User & { _id: any }) {
    return {
      success: true,
      message: 'Lấy thông tin hồ sơ cá nhân thành công',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          coverUrl: (user as any).coverUrl || null,
          bio: (user as any).bio || null,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    };
  }

  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ cá nhân (tên hiển thị, tiểu sử, ảnh bìa)' })
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user._id.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Cập nhật thông tin hồ sơ cá nhân thành công',
      data: {
        user: {
          _id: updatedUser._id,
          email: updatedUser.email,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          avatarUrl: updatedUser.avatarUrl,
          coverUrl: updatedUser.coverUrl,
          bio: updatedUser.bio,
          role: updatedUser.role,
          status: updatedUser.status,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    };
  }

  @ApiOperation({ summary: 'Cập nhật ảnh đại diện' })
  @Patch('avatar')
  @HttpCode(HttpStatus.OK)
  async updateAvatar(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: UpdateAvatarDto,
  ) {
    const updatedUser = await this.usersService.updateAvatar(
      user._id.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: {
        avatarUrl: updatedUser.avatarUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Cập nhật ảnh bìa' })
  @Patch('cover')
  @HttpCode(HttpStatus.OK)
  async updateCover(
    @CurrentUser() user: User & { _id: any },
    @Body('coverUrl') coverUrl: string,
  ) {
    const updatedUser = await this.usersService.updateCover(
      user._id.toString(),
      coverUrl,
    );
    return {
      success: true,
      message: 'Cập nhật ảnh bìa thành công',
      data: {
        coverUrl: updatedUser.coverUrl,
      },
    };
  }

  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user._id.toString(), dto);
    return {
      success: true,
      message:
        'Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được thu hồi.',
      data: {},
    };
  }
}
