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
import { AuthorsService } from '../services/authors.service.js';

@ApiTags('Authors')
@Public()
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

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
