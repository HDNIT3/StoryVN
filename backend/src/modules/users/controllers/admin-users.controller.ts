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
import { QueryUsersDto } from '../dto/query-users.dto.js';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto.js';
import { User, UserRole } from '../schemas/user.schema.js';
import { AdminUsersService } from '../services/admin-users.service.js';

@ApiTags('Admin Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiOperation({ summary: 'Lấy danh sách người dùng (phân trang, lọc, tìm kiếm)' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryUsersDto) {
    const data = await this.adminUsersService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy thống kê tổng quan người dùng theo vai trò và trạng thái' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const data = await this.adminUsersService.getStats();
    return {
      success: true,
      message: 'Lấy thống kê người dùng thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết thông tin người dùng theo ID' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.adminUsersService.findById(id);
    return {
      success: true,
      message: 'Lấy thông tin chi tiết người dùng thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Thay đổi trạng thái tài khoản (ACTIVE, BANNED)' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentActor: User & { _id: any },
  ) {
    const user = await this.adminUsersService.updateStatus(
      id,
      dto,
      currentActor as any,
    );
    return {
      success: true,
      message: 'Cập nhật trạng thái tài khoản thành công',
      data: { user },
    };
  }

  @ApiOperation({ summary: 'Thay đổi vai trò người dùng (Chỉ ADMIN)' })
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentAdmin: User & { _id: any },
  ) {
    const user = await this.adminUsersService.updateRole(
      id,
      dto,
      currentAdmin as any,
    );
    return {
      success: true,
      message: 'Cập nhật vai trò người dùng thành công',
      data: { user },
    };
  }
}
