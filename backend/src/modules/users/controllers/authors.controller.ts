import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { QueryAuthorStoriesDto } from '../dto/query-author-stories.dto.js';
import { QueryAuthorsDto } from '../dto/query-authors.dto.js';
import type { UserDocument } from '../schemas/user.schema.js';
import { UserRole } from '../schemas/user.schema.js';
import { AuthorsService } from '../services/authors.service.js';

@ApiTags('Authors')
@UseGuards(AuthGuard, RolesGuard)
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @ApiOperation({
    summary: 'Lấy thống kê tổng quan studio của tác giả hiện tại',
    description:
      'Trả về số liệu tác phẩm, chương, lượt đọc, doanh thu xu, biểu đồ 7/30/90 ngày và hoạt động gần đây của tác giả.',
  })
  @ApiBearerAuth('access-token')
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.MANAGER)
  @Get('me/overview')
  @HttpCode(HttpStatus.OK)
  async getMyAuthorOverview(@CurrentUser() user: UserDocument) {
    const data = await this.authorsService.getAuthorOverview(user._id.toString());
    return {
      success: true,
      message: 'Lấy thống kê tổng quan tác giả thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy thống kê cộng đồng sáng tác StoryVN',
    description:
      'Trả về tổng số tác giả đã đăng truyện, tổng số tác phẩm đang lưu giữ và tổng số chương đã xuất bản.',
  })
  @Public()
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getCommunityStats() {
    const stats = await this.authorsService.getCommunityStats();
    return {
      success: true,
      message: 'Lấy thống kê tác giả thành công',
      data: stats,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách tác giả công khai (kèm bộ lọc, sắp xếp, phân trang)',
    description:
      'Hỗ trợ tìm kiếm theo tên/bút danh/slug, lọc theo thể loại, trạng thái truyện, tiểu sử và sắp xếp nổi bật/mới tham gia/mới cập nhật.',
  })
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAuthorsList(@Query() query: QueryAuthorsDto) {
    const data = await this.authorsService.getAuthorsList(query);
    return {
      success: true,
      message: 'Lấy danh sách tác giả thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ công khai của tác giả theo username',
    description:
      'Trả về bút danh, tiểu sử, avatar, mạng xã hội, số lượng tác phẩm, tổng lượt xem, người theo dõi và thông tin ủng hộ.',
  })
  @ApiParam({ name: 'username', description: 'Tên định danh (username) của tác giả' })
  @Public()
  @Get(':username')
  @HttpCode(HttpStatus.OK)
  async getAuthorProfile(@Param('username') username: string) {
    const author = await this.authorsService.getAuthorPublicProfile(username);
    return {
      success: true,
      message: 'Lấy thông tin tác giả thành công',
      data: { author },
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách tác phẩm công khai của tác giả',
    description:
      'Trả về danh sách truyện đã xuất bản của tác giả có hỗ trợ lọc theo trạng thái tiến độ, sắp xếp và phân trang.',
  })
  @ApiParam({ name: 'username', description: 'Tên định danh (username) của tác giả' })
  @Public()
  @Get(':username/stories')
  @HttpCode(HttpStatus.OK)
  async getAuthorStories(
    @Param('username') username: string,
    @Query() query: QueryAuthorStoriesDto,
  ) {
    const data = await this.authorsService.getAuthorPublicStories(username, query);
    return {
      success: true,
      message: 'Lấy danh sách tác phẩm của tác giả thành công',
      data,
    };
  }
}
