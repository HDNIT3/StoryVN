import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreateStoryDto, StoryAction } from '../dto/create-story.dto.js';
import { FilterStoriesDto } from '../dto/filter-stories.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
import { QueryRecentStoriesDto } from '../dto/query-recent-stories.dto.js';
import { UpdateStoryDto } from '../dto/update-story.dto.js';
import { StoriesService } from '../services/stories.service.js';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @ApiOperation({
    summary: 'Lấy top truyện nổi bật có nhiều lượt xem nhất (Công khai)',
    description:
      'Trả về danh sách truyện có lượt xem cao nhất (mặc định 10) gồm: ảnh bìa, tên truyện, tác giả, lượt xem',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng truyện cần lấy (mặc định: 10)',
    type: Number,
  })
  @Public()
  @Get('top-views')
  @HttpCode(HttpStatus.OK)
  async getTopViews(@Query('limit') limitQuery?: string) {
    const limit = limitQuery ? parseInt(limitQuery, 10) : 10;
    const data = await this.storiesService.getTopViews(limit);

    return {
      success: true,
      message: 'Lấy danh sách truyện nổi bật thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy top truyện có tổng số từ lớn nhất (Công khai)',
    description:
      'Trả về danh sách truyện có tổng số từ cao nhất (mặc định 10) gồm: ảnh bìa, tên truyện, tác giả, tổng số từ, số chương',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng truyện cần lấy (mặc định: 10)',
    type: Number,
  })
  @Public()
  @Get('top-word-count')
  @HttpCode(HttpStatus.OK)
  async getTopWordCount(@Query('limit') limitQuery?: string) {
    const limit = limitQuery ? parseInt(limitQuery, 10) : 10;
    const data = await this.storiesService.getTopWordCount(limit);

    return {
      success: true,
      message: 'Lấy danh sách truyện có tổng số từ lớn nhất thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách truyện mới cập nhật (Công khai)',
    description:
      'Trả về danh sách truyện mới cập nhật: Thể loại, Tên, Số chương, Tác giả, Ngày giờ cập nhật có phân trang',
  })
  @Public()
  @Get('latest-updated')
  @HttpCode(HttpStatus.OK)
  async getLatestUpdated(@Query() query: QueryRecentStoriesDto) {
    const data = await this.storiesService.getLatestUpdated(query);

    return {
      success: true,
      message: 'Lấy danh sách truyện mới cập nhật thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách truyện có bộ lọc và tìm kiếm (Công khai)',
    description:
      'Lọc truyện theo thể loại, trạng thái tiến độ, sắp xếp, tìm kiếm từ khóa và phân trang',
  })
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getStories(@Query() query: FilterStoriesDto) {
    const data = await this.storiesService.filterStories(query);

    return {
      success: true,
      message: 'Lấy danh sách truyện thành công',
      data,
    };
  }

  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateStoryDto,
    @Query('action') actionQuery?: StoryAction,
  ) {
    const action = actionQuery || dto.action || StoryAction.DRAFT;
    const data = await this.storiesService.createStory(user._id, dto, action);

    return {
      success: true,
      message:
        action === StoryAction.SUBMIT
          ? 'Tạo tác phẩm và gửi yêu cầu phê duyệt thành công'
          : 'Lưu bản nháp tác phẩm thành công',
      data,
    };
  }

  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyStories(
    @CurrentUser() user: any,
    @Query() query: QueryMyStoriesDto,
  ) {
    const data = await this.storiesService.getMyStories(user._id, query);

    return {
      success: true,
      message: 'Lấy danh sách tác phẩm của tác giả thành công',
      data,
    };
  }

  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Get('my/counts')
  @HttpCode(HttpStatus.OK)
  async getMyCounts(@CurrentUser() user: any) {
    const data = await this.storiesService.getMyCounts(user._id);

    return {
      success: true,
      message: 'Lấy số lượng thống kê tác phẩm của tác giả thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy lịch sử chỉnh sửa của tác phẩm (Tác giả)',
    description:
      'Trả về danh sách các bản chỉnh sửa (DRAFT, PENDING_REVIEW, APPROVED, REJECTED) kèm nội dung snapshot, mới nhất trước',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Get('my/:id/revisions')
  @HttpCode(HttpStatus.OK)
  async getMyStoryRevisions(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.storiesService.getMyStoryRevisions(user._id, id);

    return {
      success: true,
      message: 'Lấy lịch sử chỉnh sửa tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Khôi phục một bản chỉnh sửa cũ thành bản nháp mới (Tác giả)',
    description:
      'Tạo một bản nháp mới từ nội dung của bản cũ; bản khôi phục vẫn phải qua kiểm duyệt lại',
  })
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch('my/:id/revisions/:revisionId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreMyStoryRevision(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ) {
    const data = await this.storiesService.restoreMyStoryRevision(
      user._id,
      id,
      revisionId,
    );

    return {
      success: true,
      message: 'Khôi phục bản chỉnh sửa thành công (đang ở trạng thái nháp)',
      data,
    };
  }

  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @Patch('my/:id')
  @HttpCode(HttpStatus.OK)
  async updateMyStory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStoryDto,
    @Query('action') actionQuery?: StoryAction,
  ) {
    const action = actionQuery || dto.action;
    const data = await this.storiesService.updateMyStory(user._id, id, dto, action);

    return {
      success: true,
      message:
        action === StoryAction.SUBMIT
          ? 'Cập nhật tác phẩm và gửi yêu cầu kiểm duyệt thành công'
          : action === StoryAction.WITHDRAW
            ? 'Đã rút bản chỉnh sửa về trạng thái nháp'
            : action === StoryAction.DISCARD
              ? 'Đã hủy bản chỉnh sửa'
              : 'Cập nhật thông tin tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách truyện cùng thể loại theo slug (Công khai)',
  })
  @Public()
  @Get(':slug/same-genre')
  @HttpCode(HttpStatus.OK)
  async getSameGenreStories(
    @Param('slug') slug: string,
    @Query('limit') limitQuery?: string,
  ) {
    const limit = limitQuery ? parseInt(limitQuery, 10) : 6;
    const data = await this.storiesService.getSameGenreStories(slug, limit);

    return {
      success: true,
      message: 'Lấy danh sách truyện cùng thể loại thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy chi tiết truyện theo slug (Công khai)',
    description: 'Trả về toàn bộ thông tin cơ bản của truyện, tác giả và danh sách truyện cùng thể loại',
  })
  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getStoryBySlug(@Param('slug') slug: string) {
    const data = await this.storiesService.getStoryBySlug(slug);

    return {
      success: true,
      message: 'Lấy thông tin chi tiết truyện thành công',
      data,
    };
  }
}

