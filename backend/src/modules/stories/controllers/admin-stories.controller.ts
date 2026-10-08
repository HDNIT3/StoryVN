import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { User, UserRole } from '../../users/schemas/user.schema.js';
import { AdminModerationReasonDto } from '../dto/admin-moderation-reason.dto.js';
import { AdminQueryStoriesDto } from '../dto/admin-query-stories.dto.js';
import { AdminRejectStoryDto } from '../dto/admin-reject-story.dto.js';
import { AdminStoriesService } from '../services/admin-stories.service.js';

@ApiTags('Admin Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/stories')
export class AdminStoriesController {
  constructor(private readonly adminStoriesService: AdminStoriesService) {}

  @ApiOperation({
    summary:
      'Lấy danh sách tác phẩm (lọc theo trạng thái, hiển thị công khai/riêng tư, thể loại, từ khóa, phân trang, sắp xếp)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: AdminQueryStoriesDto) {
    const data = await this.adminStoriesService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Lấy số lượng thống kê tác phẩm theo từng tab (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Bản nháp, Bị ẩn)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('counts')
  @HttpCode(HttpStatus.OK)
  async getCounts() {
    const data = await this.adminStoriesService.getCounts();
    return {
      success: true,
      message: 'Lấy số lượng thống kê tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Xem chi tiết tác phẩm theo ID (kèm thông tin tác giả, author profile, thể loại, tag, lý do từ chối nếu có)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.adminStoriesService.findById(id);
    return {
      success: true,
      message: 'Lấy thông tin chi tiết tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Phê duyệt tác phẩm (chuyển sang PUBLISHED và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
  ) {
    const data = await this.adminStoriesService.approveStory(
      id,
      reviewer._id.toString(),
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }

  @ApiOperation({
    summary: 'Từ chối duyệt tác phẩm kèm lý do (chuyển sang REJECTED và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto: AdminRejectStoryDto,
  ) {
    const data = await this.adminStoriesService.rejectStory(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }

  @ApiOperation({
    summary: 'Gỡ duyệt tác phẩm (chuyển PUBLISHED về DRAFT và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto?: AdminModerationReasonDto,
  ) {
    const data = await this.adminStoriesService.unpublishStory(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }

  @ApiOperation({
    summary: 'Cấm / Ẩn tác phẩm khỏi chế độ công khai (chuyển visibility sang PRIVATE và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/hide')
  @HttpCode(HttpStatus.OK)
  async hideStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto?: AdminModerationReasonDto,
  ) {
    const data = await this.adminStoriesService.hideStory(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }

  @ApiOperation({
    summary: 'Mở lại hiển thị công khai cho tác phẩm (chuyển visibility sang PUBLIC và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/unhide')
  @HttpCode(HttpStatus.OK)
  async unhideStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
  ) {
    const data = await this.adminStoriesService.unhideStory(
      id,
      reviewer._id.toString(),
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }
}
