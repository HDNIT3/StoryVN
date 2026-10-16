import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { ChaptersService } from '../services/chapters.service.js';
import { BulkSubmitChaptersDto } from '../dto/bulk-submit-chapters.dto.js';
import { CreateChapterDto } from '../dto/create-chapter.dto.js';
import { QueryChaptersDto } from '../dto/query-chapters.dto.js';
import { ReorderChaptersDto } from '../dto/reorder-chapters.dto.js';
import { UpdateChapterDto } from '../dto/update-chapter.dto.js';

@ApiTags('Chapters')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @ApiOperation({
    summary: 'Tạo chương mới (Tác giả) - UC-14 & UC-15',
    description: 'Tác giả tạo chương mới dưới dạng DRAFT hoặc gửi duyệt PENDING_REVIEW kèm cấu hình xu',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateChapterDto,
  ) {
    const data = await this.chaptersService.createChapter(user._id, dto, user.role);

    return {
      success: true,
      message:
        dto.action === 'SUBMIT'
          ? 'Tạo chương và gửi yêu cầu phê duyệt thành công'
          : 'Lưu bản nháp chương truyện thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Gửi duyệt hàng loạt các chương truyện (Tác giả)',
    description: 'Tác giả gửi phê duyệt cùng lúc nhiều chương truyện ở trạng thái DRAFT hoặc REJECTED',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Post('bulk-submit')
  @HttpCode(HttpStatus.OK)
  async bulkSubmit(
    @CurrentUser() user: any,
    @Body() dto: BulkSubmitChaptersDto,
  ) {
    const result = await this.chaptersService.bulkSubmitChapters(
      user._id,
      dto.chapterIds,
      user.role,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách chương của tác phẩm - UC-16',
    description: 'Lấy danh sách chương theo truyện (hỗ trợ lọc trạng thái, sắp xếp thứ tự)',
  })
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getChapters(
    @CurrentUser() user: any,
    @Query() query: QueryChaptersDto,
  ) {
    const data = await this.chaptersService.getChaptersByStory(
      user?._id,
      query,
      user?.role,
    );

    return {
      success: true,
      message: 'Lấy danh sách chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách chương theo slug truyện (Công khai)',
    description:
      'Trả về danh sách tất cả chương (kể cả chưa duyệt) với: số chương, tên, ngày tạo, ngày cập nhật',
  })
  @Public()
  @Get('story/:slug')
  @HttpCode(HttpStatus.OK)
  async getChaptersBySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    const data = await this.chaptersService.getChaptersBySlug(slug, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      order: order || 'asc',
    });

    return {
      success: true,
      message: 'Lấy danh sách chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy chi tiết một chương theo slug truyện và số chương (Công khai)',
    description:
      'Trả về nội dung chương, tiêu đề, số chương, lượt xem, kèm thông tin truyện và chương trước/sau',
  })
  @Public()
  @Get('story/:slug/chapter/:chapterNumber')
  @HttpCode(HttpStatus.OK)
  async getChapterBySlugAndNumber(
    @Param('slug') slug: string,
    @Param('chapterNumber') chapterNumber: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.chaptersService.getChapterByStorySlugAndNumber(
      slug,
      parseInt(chapterNumber, 10),
      user?._id,
      user?.role,
    );

    return {
      success: true,
      message: 'Lấy nội dung chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Sắp xếp lại thứ tự các chương - UC-16',
    description: 'Cập nhật lại số thứ tự (chapterNumber) cho các chương trong truyện',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch('stories/:storyId/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderChapters(
    @CurrentUser() user: any,
    @Param('storyId') storyId: string,
    @Body() dto: ReorderChaptersDto,
  ) {
    const data = await this.chaptersService.reorderChapters(
      user._id,
      storyId,
      dto,
      user.role,
    );

    return {
      success: true,
      message: 'Cập nhật thứ tự chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Xem thống kê các chương của tác phẩm - UC-16',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.MANAGER)
  @Get('stories/:storyId/stats')
  @HttpCode(HttpStatus.OK)
  async getStoryChaptersStats(
    @CurrentUser() user: any,
    @Param('storyId') storyId: string,
  ) {
    const data = await this.chaptersService.getStoryChaptersStats(
      user._id,
      storyId,
      user.role,
    );

    return {
      success: true,
      message: 'Lấy thống kê chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách tất cả lịch sử chỉnh sửa chương của tác giả - UC-15 & UC-16',
    description: 'Tác giả xem toàn bộ các bản chỉnh sửa chương (ChapterUpdate) có thể lọc theo truyện, chương, trạng thái',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.MANAGER)
  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getAllChapterUpdatesHistory(
    @CurrentUser() user: any,
    @Query('storyId') storyId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.chaptersService.getAllChapterUpdatesHistory(
      user._id,
      user.role,
      {
        storyId,
        chapterId,
        status,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
    );

    return {
      success: true,
      message: 'Lấy danh sách lịch sử sửa đổi thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy chi tiết một chương truyện - UC-16',
  })
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getChapterDetail(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.chaptersService.getChapterDetail(
      id,
      user?._id,
      user?.role,
    );

    return {
      success: true,
      message: 'Lấy chi tiết chương truyện thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy lịch sử các bản sửa đổi của chương - UC-15 & UC-16',
    description: 'Tác giả hoặc Quản lý xem toàn bộ các bản sửa đổi (ChapterUpdate) của chương truyện',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  async getChapterHistory(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.chaptersService.getChapterUpdatesHistory(
      id,
      user._id,
      user.role,
    );

    return {
      success: true,
      message: 'Lấy lịch sử sửa đổi chương thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Chỉnh sửa chương truyện - UC-15 & UC-16',
    description: 'Chỉnh sửa tiêu đề, nội dung, giá xu. Nếu chương đã PUBLISHED, hệ thống sẽ chuyển sang PENDING_REVIEW để duyệt lại.',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateChapter(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    const data = await this.chaptersService.updateChapter(
      user._id,
      id,
      dto,
      user.role,
    );

    return {
      success: true,
      message:
        dto.action === 'SUBMIT'
          ? 'Cập nhật và gửi yêu cầu phê duyệt chương thành công'
          : 'Cập nhật chương truyện thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Xóa chương truyện - UC-16',
    description: 'Xóa chương ở trạng thái DRAFT hoặc PENDING_REVIEW. Không xóa trực tiếp chương PUBLISHED.',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteChapter(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.chaptersService.deleteChapter(
      user._id,
      id,
      user.role,
    );

    return {
      success: true,
      message: data.message,
    };
  }
}
