import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator.js';
import { QueryAuthorStoriesDto } from '../dto/query-author-stories.dto.js';
import { QueryAuthorsDto } from '../dto/query-authors.dto.js';
import { AuthorsService } from '../services/authors.service.js';

@ApiTags('Authors')
@Public()
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @ApiOperation({
    summary: 'Lấy thống kê cộng đồng sáng tác StoryVN',
    description:
      'Trả về tổng số tác giả đã đăng truyện, tổng số tác phẩm đang lưu giữ và tổng số chương đã xuất bản.',
  })
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
