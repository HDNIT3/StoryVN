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
import { DateRangeQueryDto } from '../../common/dto/date-range.dto.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { ContentStatisticsQueryDto } from './content-statistics-query.dto.js';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('financial-summary')
  @ApiOperation({ summary: 'Tổng tiền nạp xu và chi nhuận bút toàn hệ thống' })
  async getFinancialSummary() {
    return {
      success: true,
      message: 'Lấy tổng quan tài chính thành công',
      data: await this.adminDashboardService.getFinancialSummary(),
    };
  }

  @Get('content')
  @ApiOperation({ summary: 'Thống kê truyện, chương, tác giả và hàng đợi kiểm duyệt' })
  async getContentStatistics(@Query() query: ContentStatisticsQueryDto) {
    return {
      success: true,
      message: 'Lấy thống kê truyện và tác giả thành công',
      data: await this.adminDashboardService.getContentStatistics(query),
    };
  }

  @ApiOperation({
    summary: 'Lấy dữ liệu tổng quan, biểu đồ thời gian thực và hàng đợi kiểm duyệt cho Admin Dashboard',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Explicit trailing days (1-366). Omit days and date endpoints for all time.',
    type: Number,
  })
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-01-31' })
  async getOverview(@Query() query: DateRangeQueryDto) {
    const data = await this.adminDashboardService.getOverview(query);
    return {
      success: true,
      message: 'Lấy dữ liệu thống kê quản trị thành công',
      data,
    };
  }
}

