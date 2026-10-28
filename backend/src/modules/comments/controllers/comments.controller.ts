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
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { User, UserRole } from '../../users/schemas/user.schema.js';
import { AdminQueryCommentsDto } from '../dto/admin-query-comments.dto.js';
import { CreateCommentDto } from '../dto/create-comment.dto.js';
import { QueryCommentsDto } from '../dto/query-comments.dto.js';
import { QueryRepliesDto } from '../dto/query-replies.dto.js';
import { UpdateCommentStatusDto } from '../dto/update-comment-status.dto.js';
import { UpdateCommentDto } from '../dto/update-comment.dto.js';
import { CommentsService } from '../services/comments.service.js';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({
    summary: 'Đăng bình luận mới (ở trang truyện, ở chương, hoặc trả lời)',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: CreateCommentDto,
  ) {
    const data = await this.commentsService.createComment(
      user._id.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Đăng bình luận thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách bình luận gốc của truyện hoặc chương',
  })
  @UseGuards(AuthGuard)
  @Public()
  @Get('stories/:storyId/comments')
  async getStoryComments(
    @Param('storyId') storyId: string,
    @Query() query: QueryCommentsDto,
    @CurrentUser() user?: User & { _id: any },
  ) {
    const data = await this.commentsService.getStoryComments(
      storyId,
      query,
      user,
    );
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách câu trả lời con của một bình luận',
  })
  @UseGuards(AuthGuard)
  @Public()
  @Get('comments/:id/replies')
  async getCommentReplies(
    @Param('id') parentId: string,
    @Query() query: QueryRepliesDto,
    @CurrentUser() user?: User & { _id: any },
  ) {
    const data = await this.commentsService.getCommentReplies(
      parentId,
      query,
      user,
    );
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: 'Chỉnh sửa nội dung bình luận của chính mình' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('comments/:id')
  async updateComment(
    @CurrentUser() user: User & { _id: any },
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    const data = await this.commentsService.updateComment(
      user._id.toString(),
      commentId,
      dto,
    );
    return {
      success: true,
      message: 'Cập nhật bình luận thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa bình luận (Chính chủ hoặc Quản trị viên)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('comments/:id')
  async deleteComment(
    @CurrentUser() user: User & { _id: any },
    @Param('id') commentId: string,
  ) {
    await this.commentsService.deleteComment(
      user._id.toString(),
      user.role,
      commentId,
    );
    return {
      success: true,
      message: 'Xóa bình luận thành công',
    };
  }

  @ApiOperation({
    summary:
      'Ẩn hoặc hiện lại bình luận (Dành cho Admin, Quản lý hoặc Tác giả của truyện)',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('comments/:id/visibility')
  async toggleCommentVisibility(
    @CurrentUser() user: User & { _id: any },
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentStatusDto,
  ) {
    const data = await this.commentsService.toggleCommentVisibility(
      user._id.toString(),
      user.role,
      commentId,
      dto.status,
    );
    return {
      success: true,
      message:
        dto.status === 'VISIBLE'
          ? 'Đã hiển thị lại bình luận thành công'
          : 'Đã ẩn bình luận thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy chi tiết một bình luận theo ID' })
  @Public()
  @Get('comments/:id')
  async getCommentById(@Param('id') commentId: string) {
    const data = await this.commentsService.getCommentById(commentId);
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Lấy danh sách bình luận toàn hệ thống' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('admin/comments')
  async adminGetComments(@Query() query: AdminQueryCommentsDto) {
    const data = await this.commentsService.adminGetComments(query);
    return {
      success: true,
      message: 'Lấy danh sách bình luận thành công',
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Thống kê số lượng bình luận theo trạng thái' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('admin/comments/counts')
  async adminGetCommentCounts() {
    const data = await this.commentsService.adminGetCommentCounts();
    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Cập nhật trạng thái bình luận (VISIBLE, HIDDEN, DELETED)' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Patch('admin/comments/:id/status')
  async adminUpdateCommentStatus(
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentStatusDto,
  ) {
    const data = await this.commentsService.adminUpdateCommentStatus(commentId, dto.status);
    return {
      success: true,
      message: 'Cập nhật trạng thái bình luận thành công',
      data,
    };
  }

  @ApiOperation({ summary: '[Admin/Manager] Xóa vĩnh viễn bình luận' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(AuthGuard, RolesGuard)
  @Delete('admin/comments/:id/permanent')
  async adminDeleteCommentPermanent(@Param('id') commentId: string) {
    await this.commentsService.adminDeleteCommentPermanent(commentId);
    return {
      success: true,
      message: 'Xóa vĩnh viễn bình luận thành công',
    };
  }
}
