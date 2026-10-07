import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { User } from '../users/schemas/user.schema.js';
import { QueryNotificationsDto } from './dto/query-notifications.dto.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'SSE stream thông báo thời gian thực' })
  @Sse('stream')
  streamNotification(
    @CurrentUser() user: User & { _id: any },
  ): Observable<{ data: any }> {
    return this.notificationsService.getNotificationStream(user._id.toString());
  }

  @ApiOperation({ summary: 'Lấy danh sách thông báo của tôi' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyNotifications(
    @CurrentUser() user: User & { _id: any },
    @Query() query: QueryNotificationsDto,
  ) {
    const data = await this.notificationsService.findAllForUser(
      user._id.toString(),
      query,
    );
    return {
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Đếm số thông báo chưa đọc' })
  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@CurrentUser() user: User & { _id: any }) {
    const data = await this.notificationsService.countUnread(user._id.toString());
    return {
      success: true,
      message: 'Lấy số thông báo chưa đọc thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markOneAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User & { _id: any },
  ) {
    const notification = await this.notificationsService.markOneAsRead(
      id,
      user._id.toString(),
    );
    return {
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
      data: { notification },
    };
  }

  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser() user: User & { _id: any }) {
    const data = await this.notificationsService.markAllAsRead(user._id.toString());
    return {
      success: true,
      message: `Đã đánh dấu ${data.modifiedCount} thông báo là đã đọc`,
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa một thông báo' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOne(
    @Param('id') id: string,
    @CurrentUser() user: User & { _id: any },
  ) {
    await this.notificationsService.deleteOne(id, user._id.toString());
    return {
      success: true,
      message: 'Đã xóa thông báo',
    };
  }

  @ApiOperation({ summary: 'Xóa tất cả thông báo đã đọc' })
  @Delete('clear-read')
  @HttpCode(HttpStatus.OK)
  async deleteAllRead(@CurrentUser() user: User & { _id: any }) {
    const data = await this.notificationsService.deleteAllRead(user._id.toString());
    return {
      success: true,
      message: `Đã xóa ${data.deletedCount} thông báo đã đọc`,
      data,
    };
  }
}
