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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreateStoryDto, StoryAction } from '../dto/create-story.dto.js';
import { QueryMyStoriesDto } from '../dto/query-my-stories.dto.js';
import { UpdateStoryDto } from '../dto/update-story.dto.js';
import { StoriesService } from '../services/stories.service.js';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

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
          : 'Cập nhật thông tin tác phẩm thành công',
      data,
    };
  }
}
