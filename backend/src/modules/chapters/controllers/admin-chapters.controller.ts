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
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { AdminChapterModerationReasonDto } from '../dto/admin-chapter-moderation-reason.dto.js';
import { AdminQueryChaptersDto } from '../dto/admin-query-chapters.dto.js';
import { AdminRejectChapterDto } from '../dto/admin-reject-chapter.dto.js';
import { AdminChaptersService } from '../services/admin-chapters.service.js';

@ApiTags('Admin Chapters')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/chapters')
export class AdminChaptersController {
  constructor(private readonly adminChaptersService: AdminChaptersService) {}

  @ApiOperation({
    summary:
      'Lấy danh sách tất cả chương (hỗ trợ lọc storyId, status, search, sắp xếp, phân trang)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: AdminQueryChaptersDto) {
    const data = await this.adminChaptersService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Lấy danh sách chương chờ duyệt (tiện ích lọc nhanh PENDING_REVIEW)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async findPending(@Query() query: AdminQueryChaptersDto) {
    query.status = ChapterStatus.PENDING_REVIEW;
    const data = await this.adminChaptersService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách chương chờ duyệt thành công',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Lấy số lượng thống kê chương theo từng tab trạng thái (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Bản nháp)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('counts')
  @HttpCode(HttpStatus.OK)
  async getCounts(@Query('storyId') storyId?: string) {
    const data = await this.adminChaptersService.getCounts(storyId);
    return {
      success: true,
      message: 'Lấy số lượng thống kê chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Xem chi tiết chương theo ID (kèm toàn bộ nội dung, thông tin truyện và tác giả)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.adminChaptersService.findById(id);
    return {
      success: true,
      message: 'Lấy thông tin chi tiết chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Phê duyệt chương truyện (chuyển sang PUBLISHED và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
  ) {
    const data = await this.adminChaptersService.approveChapter(
      id,
      reviewer._id.toString(),
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }

  @ApiOperation({
    summary:
      'Hủy duyệt / Từ chối duyệt chương truyện kèm lý do (chuyển sang REJECTED và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto: AdminRejectChapterDto,
  ) {
    const data = await this.adminChaptersService.rejectChapter(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }

  @ApiOperation({
    summary:
      'Gỡ duyệt chương truyện (chuyển từ PUBLISHED về DRAFT và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto?: AdminChapterModerationReasonDto,
  ) {
    const data = await this.adminChaptersService.unpublishChapter(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }

  @ApiOperation({
    summary: 'Ẩn chương truyện khỏi công khai (chuyển sang HIDDEN và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/hide')
  @HttpCode(HttpStatus.OK)
  async hideChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto?: AdminChapterModerationReasonDto,
  ) {
    const data = await this.adminChaptersService.hideChapter(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }

  @ApiOperation({
    summary: 'Mở lại chương truyện bị ẩn (chuyển về PUBLISHED và gửi thông báo)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/unhide')
  @HttpCode(HttpStatus.OK)
  async unhideChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
  ) {
    const data = await this.adminChaptersService.unhideChapter(
      id,
      reviewer._id.toString(),
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }

  @ApiOperation({
    summary:
      'Chuyển chương truyện (bị từ chối) quay lại hàng đợi chờ duyệt (chuyển sang PENDING_REVIEW)',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/reset-pending')
  @HttpCode(HttpStatus.OK)
  async resetPendingChapter(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
  ) {
    const data = await this.adminChaptersService.resetPendingChapter(
      id,
      reviewer._id.toString(),
    );
    return {
      success: true,
      message: data.message,
      data: data.chapter,
    };
  }
}
