import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreateSystemConfigDto } from '../dto/create-system-config.dto.js';
import { UpdateSystemConfigDto } from '../dto/update-system-config.dto.js';
import { SystemConfigService } from '../services/system-config.service.js';

@ApiTags('System Config')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async list() {
    const data = await this.systemConfigService.list();
    return { success: true, data };
  }

  @Post()
  async create(
    @Body() dto: CreateSystemConfigDto,
    @CurrentUser('_id') adminId: Types.ObjectId,
  ) {
    await this.systemConfigService.create(dto, adminId);
    return { success: true, message: 'Đã thêm tham số cấu hình.' };
  }

  @Post('seed-footer')
  async seedFooter(@CurrentUser('_id') adminId: Types.ObjectId) {
    await this.systemConfigService.seedFooter(adminId);
    return { success: true, message: 'Đã khởi tạo cấu hình chân trang.' };
  }

  @Patch(':key')
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSystemConfigDto,
    @CurrentUser('_id') adminId: Types.ObjectId,
  ) {
    await this.systemConfigService.update(key, dto, adminId);
    return { success: true, message: 'Đã cập nhật tham số cấu hình.' };
  }
}
