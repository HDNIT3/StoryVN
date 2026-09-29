import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { User } from '../schemas/user.schema.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ cá nhân của người dùng đang đăng nhập',
  })
  @UseGuards(AuthGuard)
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
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    };
  }
}

