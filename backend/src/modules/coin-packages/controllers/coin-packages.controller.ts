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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreateCoinPackageDto } from '../dto/create-coin-package.dto.js';
import { QueryCoinPackageDto } from '../dto/query-coin-package.dto.js';
import { UpdateCoinPackageDto } from '../dto/update-coin-package.dto.js';
import { CoinPackagesService } from '../services/coin-packages.service.js';

@ApiTags('Coin Packages')
@Controller('coin-packages')
export class CoinPackagesController {
  constructor(private readonly coinPackagesService: CoinPackagesService) {}

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Khởi tạo danh sách gói nạp mặc định (Seed Data)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('admin/seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    const data = await this.coinPackagesService.seedDefault();
    return {
      success: true,
      message: `Khởi tạo dữ liệu gói nạp thành công: ${data.createdCount} mới, ${data.skippedCount} đã tồn tại`,
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách gói nạp cho Admin (phân trang, lọc, tìm kiếm)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('admin')
  @HttpCode(HttpStatus.OK)
  async findAdminAll(@Query() query: QueryCoinPackageDto) {
    const data = await this.coinPackagesService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách gói nạp thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Tạo mới gói nạp Xu' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCoinPackageDto) {
    const data = await this.coinPackagesService.create(dto);
    return {
      success: true,
      message: 'Tạo gói nạp Xu thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của gói nạp' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleStatus(@Param('id') id: string) {
    const data = await this.coinPackagesService.toggleStatus(id);
    return {
      success: true,
      message: `${data.isActive ? 'Kích hoạt' : 'Ẩn'} gói nạp thành công`,
      data,
    };
  }

  @ApiOperation({ summary: 'Cập nhật thông tin gói nạp theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateCoinPackageDto) {
    const data = await this.coinPackagesService.update(id, dto);
    return {
      success: true,
      message: 'Cập nhật gói nạp thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa gói nạp theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.coinPackagesService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }

  // ─── USER / PUBLIC ENDPOINTS ────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lấy danh sách gói nạp đang hoạt động (cho User/Công khai)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getActivePackages() {
    const data = await this.coinPackagesService.findActivePackages();
    return {
      success: true,
      message: 'Lấy danh sách gói nạp hoạt động thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết gói nạp theo ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.coinPackagesService.findById(id);
    return {
      success: true,
      message: 'Lấy chi tiết gói nạp thành công',
      data,
    };
  }
}
