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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { User, UserRole } from '../../users/schemas/user.schema.js';
import { AdminQueryRatingsDto } from '../dto/admin-query-ratings.dto.js';
import { AdminUpdateRatingStatusDto } from '../dto/admin-update-rating-status.dto.js';
import { CreateRatingDto } from '../dto/create-rating.dto.js';
import { QueryRatingsDto } from '../dto/query-ratings.dto.js';
import { StoryRatingsService } from '../services/story-ratings.service.js';

@ApiTags('Story Ratings')
@Controller()
export class StoryRatingsController {
  constructor(private readonly ratingsService: StoryRatingsService) {}

  @ApiOperation({ summary: 'Đánh giá hoặc cập nhật đánh giá truyện (Upsert)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('stories/:storyId/ratings')
  @HttpCode(HttpStatus.OK)
  async rateStory(
    @CurrentUser() user: User & { _id: any },
    @Param('storyId') storyId: string,
    @Body() dto: CreateRatingDto,
  ) {
    const data = await this.ratingsService.rateStory(
      user._id.toString(),
      storyId,
      dto,
    );
    return {
      success: true,
      message: 'Đánh giá truyện thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách đánh giá của truyện' })
  @Get('stories/:storyId/ratings')
  async getStoryRatings(
    @Param('storyId') storyId: string,
    @Query() query: QueryRatingsDto,
  ) {
    const result = await this.ratingsService.getStoryRatings(storyId, query);
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({ summary: 'Lấy tóm tắt phân bổ số sao của truyện' })
  @Get('stories/:storyId/ratings/summary')
  async getRatingSummary(@Param('storyId') storyId: string) {
    const data = await this.ratingsService.getRatingSummary(storyId);
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy đánh giá của chính người dùng hiện tại' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('stories/:storyId/ratings/me')
  async getMyRating(
    @CurrentUser() user: User & { _id: any },
    @Param('storyId') storyId: string,
  ) {
    const data = await this.ratingsService.getMyRating(
      user._id.toString(),
      storyId,
    );
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa đánh giá của chính mình' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('stories/:storyId/ratings/me')
  async deleteMyRating(
    @CurrentUser() user: User & { _id: any },
    @Param('storyId') storyId: string,
  ) {
    await this.ratingsService.deleteMyRating(user._id.toString(), storyId);
    return {
      success: true,
      message: 'Xóa đánh giá thành công',
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Cập nhật trạng thái đánh giá' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Patch('admin/ratings/:id/status')
  async adminUpdateStatus(
    @Param('id') ratingId: string,
    @Body() dto: AdminUpdateRatingStatusDto,
  ) {
    const data = await this.ratingsService.adminUpdateStatus(
      ratingId,
      dto.status,
    );
    return {
      success: true,
      message: 'Cập nhật trạng thái đánh giá thành công',
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Lấy danh sách đánh giá toàn hệ thống' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('admin/ratings')
  async adminGetRatings(@Query() query: AdminQueryRatingsDto) {
    const data = await this.ratingsService.adminGetRatings(query);
    return {
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Thống kê số lượng đánh giá theo trạng thái' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('admin/ratings/counts')
  async adminGetRatingCounts() {
    const data = await this.ratingsService.adminGetRatingCounts();
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Xóa vĩnh viễn đánh giá' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Delete('admin/ratings/:id')
  async adminDeleteRating(@Param('id') ratingId: string) {
    await this.ratingsService.adminDeleteRating(ratingId);
    return {
      success: true,
      message: 'Xóa vĩnh viễn đánh giá thành công',
    };
  }
}

