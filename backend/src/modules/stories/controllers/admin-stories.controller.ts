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
import { QueryAdminStoriesDto } from '../dto/query-admin-stories.dto.js';
import { ReviewStoryDto } from '../dto/review-story.dto.js';
import { StoriesService } from '../services/stories.service.js';

@ApiTags('Admin Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/stories')
export class AdminStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @ApiOperation({ summary: 'Lấy danh sách tác phẩm cho Quản lý / Admin kiểm duyệt' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getStories(@Query() query: QueryAdminStoriesDto) {
    const data = await this.storiesService.getStoriesForAdmin(query);
    return {
      success: true,
      message: 'Lấy danh sách tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy thống kê số lượng tác phẩm theo trạng thái kiểm duyệt' })
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const data = await this.storiesService.getStoryStatsForAdmin();
    return {
      success: true,
      message: 'Lấy thống kê kiểm duyệt tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy chi tiết tác phẩm để thẩm định nội dung, văn án, bìa' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getStoryDetail(@Param('id') id: string) {
    const data = await this.storiesService.getStoryDetailForAdmin(id);
    return {
      success: true,
      message: 'Lấy chi tiết tác phẩm thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Phê duyệt hoặc từ chối xuất bản tác phẩm' })
  @Patch(':id/review')
  @HttpCode(HttpStatus.OK)
  async reviewStory(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto: ReviewStoryDto,
  ) {
    const data = await this.storiesService.reviewStory(
      reviewer._id.toString(),
      id,
      dto,
    );
    return {
      success: true,
      message: data.message,
      data: data.story,
    };
  }
}
