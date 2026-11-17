import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { AdminQueryReportsDto } from '../dto/reports.dto.js';
import { ReportsService } from '../services/reports.service.js';

@ApiTags('Admin Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  async list(@Query() query: AdminQueryReportsDto) {
    return { success: true, data: await this.reports.list(query) };
  }
}
