import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { CreateAuthorRequestDto } from '../dto/create-author-request.dto.js';
import { QueryAuthorRequestsDto } from '../dto/query-author-requests.dto.js';
import { ReviewAuthorRequestDto } from '../dto/review-author-request.dto.js';
import { UpdateAuthorRequestDto } from '../dto/update-author-request.dto.js';
import { User, UserRole } from '../schemas/user.schema.js';
import { AuthorRequestsService } from '../services/author-requests.service.js';

@ApiTags('Author Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class AuthorRequestsController {
  constructor(private readonly authorRequestsService: AuthorRequestsService) {}

  @ApiOperation({
    summary: 'Gửi yêu cầu nâng cấp tác giả (dành cho người dùng role USER)',
  })
  @ApiResponse({
    status: 201,
    description: 'Gửi yêu cầu nâng cấp tác giả thành công',
  })
  @Post('author-request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: CreateAuthorRequestDto,
  ) {
    const request = await this.authorRequestsService.createRequest(
      user._id.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Gửi yêu cầu nâng cấp tác giả thành công',
      data: { request },
    };
  }

  @ApiOperation({
    summary: 'Phía author xem thông tin author_profile và trạng thái đã xử lý hay chưa',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin author_profile và trạng thái yêu cầu thành công',
  })
  @Get('author-request')
  @HttpCode(HttpStatus.OK)
  async getAuthorProfileAndRequestStatus(
    @CurrentUser() user: User & { _id: any },
  ) {
    const data =
      await this.authorRequestsService.getAuthorProfileAndRequestStatus(
        user._id.toString(),
      );
    return {
      success: true,
      message: 'Lấy thông tin tác giả và trạng thái xử lý thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Chỉnh sửa thông tin yêu cầu nâng cấp tác giả lúc chưa duyệt (PENDING) hoặc từ chối (REJECTED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chỉnh sửa yêu cầu nâng cấp tác giả thành công',
  })
  @Put('author-request')
  @HttpCode(HttpStatus.OK)
  async updateRequest(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: UpdateAuthorRequestDto,
  ) {
    const request =
      await this.authorRequestsService.updatePendingOrRejectedRequest(
        user._id.toString(),
        dto,
      );
    return {
      success: true,
      message: 'Cập nhật yêu cầu nâng cấp tác giả thành công',
      data: { request },
    };
  }

  @ApiOperation({
    summary: 'Admin / Manager xem danh sách yêu cầu nâng cấp (có phân trang chuẩn và lọc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách yêu cầu thành công',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('author-requests')
  @HttpCode(HttpStatus.OK)
  async findAllRequests(@Query() query: QueryAuthorRequestsDto) {
    const data = await this.authorRequestsService.findAllRequests(query);
    return {
      success: true,
      message: 'Lấy danh sách yêu cầu nâng cấp tác giả thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Admin / Manager xử lý nâng cấp (duyệt chuyển đổi role sang AUTHOR & tạo author_profile, hoặc từ chối)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu nâng cấp (ObjectId)',
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý yêu cầu thành công, chuyển đổi role nếu duyệt',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('author-requests/:id/review')
  @HttpCode(HttpStatus.OK)
  async reviewRequest(
    @Param('id') id: string,
    @CurrentUser() reviewer: User & { _id: any },
    @Body() dto: ReviewAuthorRequestDto,
  ) {
    const result = await this.authorRequestsService.reviewRequest(
      id,
      reviewer._id.toString(),
      dto,
    );
    return {
      success: true,
      message: result.message,
      data: { request: result.request },
    };
  }
}
