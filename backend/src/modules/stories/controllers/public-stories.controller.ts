import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { OptionalAuthGuard } from '../../../common/guards/optional-auth.guard.js';
import { QueryPublicStoriesDto } from '../dto/query-public-stories.dto.js';
import { RateStoryDto } from '../dto/rate-story.dto.js';
import { PublicStoriesService } from '../services/public-stories.service.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';

@ApiTags('Public Stories')
@Controller('public/stories')
export class PublicStoriesController {
  constructor(private readonly publicStoriesService: PublicStoriesService) {}

  @ApiOperation({ summary: 'Lấy danh sách truyện đã xuất bản (có lọc, tìm kiếm, phân trang)' })
  @UseGuards(OptionalAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicStories(@Query() query: QueryPublicStoriesDto) {
    const data = await this.publicStoriesService.getPublicStories(query);
    return { success: true, message: 'Lấy danh sách truyện thành công', data };
  }

  @ApiOperation({ summary: 'Top truyện theo lượt xem (cho banner trang chủ)' })
  @Get('top-views')
  @HttpCode(HttpStatus.OK)
  async getTopViews(@Query('limit') limit?: string) {
    const data = await this.publicStoriesService.getTopByViews(limit ? parseInt(limit) : 10);
    return { success: true, message: 'Lấy top truyện theo lượt xem thành công', data };
  }

  @ApiOperation({ summary: 'Top truyện theo lượt like' })
  @Get('top-likes')
  @HttpCode(HttpStatus.OK)
  async getTopLikes(@Query('limit') limit?: string) {
    const data = await this.publicStoriesService.getTopByLikes(limit ? parseInt(limit) : 10);
    return { success: true, message: 'Lấy top truyện theo lượt like thành công', data };
  }

  @ApiOperation({ summary: 'Lấy danh sách truyện user đã like' })
  @UseGuards(AuthGuard)
  @Get('user/likes')
  @HttpCode(HttpStatus.OK)
  async getMyLikedStories(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.getUserLikedStories(user._id.toString());
    return { success: true, message: 'Lấy danh sách truyện đã thích thành công', data };
  }

  @ApiOperation({ summary: 'Lấy danh sách truyện user đang theo dõi' })
  @UseGuards(AuthGuard)
  @Get('user/follows')
  @HttpCode(HttpStatus.OK)
  async getMyFollowedStories(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.getUserFollowedStories(user._id.toString());
    return { success: true, message: 'Lấy danh sách truyện đang theo dõi thành công', data };
  }

  @ApiOperation({ summary: 'Lấy danh sách truyện user đã đánh giá' })
  @UseGuards(AuthGuard)
  @Get('user/ratings')
  @HttpCode(HttpStatus.OK)
  async getMyRatedStories(@CurrentUser() user: any) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.getUserRatedStories(user._id.toString());
    return { success: true, message: 'Lấy danh sách truyện đã đánh giá thành công', data };
  }

  @ApiOperation({ summary: 'Xem chi tiết truyện (slug hoặc id)' })
  @UseGuards(OptionalAuthGuard)
  @Get(':slugOrId')
  @HttpCode(HttpStatus.OK)
  async getStoryDetail(
    @Param('slugOrId') slugOrId: string,
    @CurrentUser() user?: any,
  ) {
    const story = await this.publicStoriesService.getPublicStoryDetail(slugOrId);
    let interaction: { liked: boolean; followed: boolean; myRating: number | null } = {
      liked: false,
      followed: false,
      myRating: null,
    };
    if (user?._id) {
      interaction = await this.publicStoriesService.getMyInteraction(
        story._id.toString(),
        user._id.toString(),
      );
    }
    return {
      success: true,
      message: 'Lấy chi tiết truyện thành công',
      data: { ...story, interaction },
    };
  }

  @ApiOperation({ summary: 'Tăng lượt xem sau 5 giây ở trang chi tiết' })
  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async recordView(@Param('id') id: string) {
    await this.publicStoriesService.incrementView(id);
    return { success: true, message: 'Ghi nhận lượt xem thành công' };
  }

  @ApiOperation({ summary: 'Toggle like truyện (yêu cầu đăng nhập)' })
  @UseGuards(AuthGuard)
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.toggleLike(id, user._id.toString());
    return {
      success: true,
      message: data.liked ? 'Đã thêm like' : 'Đã bỏ like',
      data,
    };
  }

  @ApiOperation({ summary: 'Toggle theo dõi truyện (yêu cầu đăng nhập)' })
  @UseGuards(AuthGuard)
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  async toggleFollow(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.toggleFollow(id, user._id.toString());
    return {
      success: true,
      message: data.followed ? 'Đã theo dõi truyện' : 'Đã bỏ theo dõi',
      data,
    };
  }

  @ApiOperation({ summary: 'Đánh giá truyện (yêu cầu đăng nhập)' })
  @UseGuards(AuthGuard)
  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  async rateStory(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RateStoryDto,
  ) {
    if (!user) throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
    const data = await this.publicStoriesService.rateStory(id, user._id.toString(), dto);
    return { success: true, message: 'Đánh giá truyện thành công', data };
  }
}
