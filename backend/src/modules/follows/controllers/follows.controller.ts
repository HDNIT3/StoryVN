import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { User } from '../../users/schemas/user.schema.js';
import {
  QueryFollowedAuthorsDto,
  QueryFollowedStoriesDto,
} from '../dto/query-follows.dto.js';
import { ToggleFollowDto } from '../dto/toggle-follow.dto.js';
import { FollowTargetType } from '../schemas/follow.schema.js';
import { FollowsService } from '../services/follows.service.js';

@ApiTags('Follows')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @ApiOperation({ summary: 'Toggle theo dõi / bỏ theo dõi' })
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleFollow(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: ToggleFollowDto,
  ) {
    const data = await this.followsService.toggleFollow(
      user._id.toString(),
      dto.targetType,
      dto.targetId,
    );

    return {
      success: true,
      message: data.isFollowing
        ? 'Theo dõi thành công'
        : 'Bỏ theo dõi thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Theo dõi truyện hoặc tác giả' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: ToggleFollowDto,
  ) {
    const data = await this.followsService.follow(
      user._id.toString(),
      dto.targetType,
      dto.targetId,
    );

    return {
      success: true,
      message: 'Theo dõi thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Bỏ theo dõi truyện hoặc tác giả' })
  @Delete(':targetType/:targetId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @CurrentUser() user: User & { _id: any },
    @Param('targetType') targetType: FollowTargetType,
    @Param('targetId') targetId: string,
  ) {
    const data = await this.followsService.unfollow(
      user._id.toString(),
      targetType,
      targetId,
    );

    return {
      success: true,
      message: 'Bỏ theo dõi thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Kiểm tra trạng thái follow' })
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async checkStatus(
    @CurrentUser() user: User & { _id: any },
    @Query('targetType') targetType: FollowTargetType,
    @Query('targetId') targetId: string,
  ) {
    const data = await this.followsService.checkFollowStatus(
      user._id.toString(),
      targetType,
      targetId,
    );

    return {
      success: true,
      message: 'Kiểm tra trạng thái follow thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Kiểm tra trạng thái follow hàng loạt' })
  @Post('status/batch')
  @HttpCode(HttpStatus.OK)
  async checkBatchStatus(
    @CurrentUser() user: User & { _id: any },
    @Body() body: { targetType: FollowTargetType; targetIds: string[] },
  ) {
    const data = await this.followsService.checkBatchStatus(
      user._id.toString(),
      body.targetType,
      body.targetIds,
    );

    return {
      success: true,
      message: 'Kiểm tra trạng thái follow hàng loạt thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách truyện đang theo dõi' })
  @Get('stories')
  @HttpCode(HttpStatus.OK)
  async getFollowedStories(
    @CurrentUser() user: User & { _id: any },
    @Query() query: QueryFollowedStoriesDto,
  ) {
    const data = await this.followsService.getFollowedStories(
      user._id.toString(),
      query,
    );

    return {
      success: true,
      message: 'Lấy danh sách truyện đang theo dõi thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách tác giả đang theo dõi' })
  @Get('authors')
  @HttpCode(HttpStatus.OK)
  async getFollowedAuthors(
    @CurrentUser() user: User & { _id: any },
    @Query() query: QueryFollowedAuthorsDto,
  ) {
    const data = await this.followsService.getFollowedAuthors(
      user._id.toString(),
      query,
    );

    return {
      success: true,
      message: 'Lấy danh sách tác giả đang theo dõi thành công',
      data,
    };
  }
}
