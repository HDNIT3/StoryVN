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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { CreateAuthorRequestDto } from '../dto/create-author-request.dto.js';
import { QueryAuthorRequestsDto } from '../dto/query-author-requests.dto.js';
import { ReviewAuthorRequestDto } from '../dto/review-author-request.dto.js';
import { UpdateAuthorProfileDto } from '../dto/update-author-profile.dto.js';
import { UpdateAuthorRequestDto } from '../dto/update-author-request.dto.js';
import { User, UserRole } from '../schemas/user.schema.js';
import { AuthorRequestsService } from '../services/author-requests.service.js';

@ApiTags('Author Requests')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class AuthorRequestsController {
  constructor(private readonly authorRequestsService: AuthorRequestsService) {}

  @ApiOperation({ summary: 'Gửi yêu cầu nâng cấp tác giả (role USER)' })
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

  @ApiOperation({ summary: 'Xem thông tin author_profile và trạng thái yêu cầu của bản thân' })
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

  @ApiOperation({ summary: 'Chỉnh sửa yêu cầu nâng cấp tác giả lúc chưa duyệt hoặc bị từ chối' })
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

  @ApiOperation({ summary: 'Lấy thông tin hồ sơ tác giả của bản thân (role AUTHOR)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.MANAGER, UserRole.ADMIN)
  @Get('author-profile')
  @HttpCode(HttpStatus.OK)
  async getAuthorProfile(@CurrentUser() user: User & { _id: any }) {
    const authorProfile = await this.authorRequestsService.getAuthorProfile(
      user._id.toString(),
    );
    return {
      success: true,
      message: 'Lấy thông tin hồ sơ tác giả thành công',
      data: { authorProfile },
    };
  }

  @ApiOperation({ summary: 'Chỉnh sửa hồ sơ tác giả (role AUTHOR)' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.MANAGER, UserRole.ADMIN)
  @Put('author-profile')
  @HttpCode(HttpStatus.OK)
  async updateAuthorProfile(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: UpdateAuthorProfileDto,
  ) {
    const authorProfile = await this.authorRequestsService.updateAuthorProfile(
      user._id.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Cập nhật hồ sơ tác giả thành công',
      data: { authorProfile },
    };
  }

  @ApiOperation({ summary: 'Xem danh sách yêu cầu nâng cấp (Admin / Manager)' })
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

  @ApiOperation({ summary: 'Duyệt hoặc từ chối yêu cầu nâng cấp tác giả (Admin / Manager)' })
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
