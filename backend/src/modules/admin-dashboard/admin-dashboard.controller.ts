import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../users/schemas/user.schema.js';
import { AdminDashboardService } from './admin-dashboard.service.js';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({
    summary: 'Lấy dữ liệu tổng quan, biểu đồ thời gian thực và hàng đợi kiểm duyệt cho Admin Dashboard',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Số ngày thống kê cho biểu đồ (mặc định 14 ngày, min 7, max 60)',
    type: Number,
  })
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(@Query('days') days?: number) {
    const data = await this.adminDashboardService.getOverview(days);
    return {
      success: true,
      message: 'Lấy dữ liệu thống kê quản trị thành công',
      data,
    };
  }
}

