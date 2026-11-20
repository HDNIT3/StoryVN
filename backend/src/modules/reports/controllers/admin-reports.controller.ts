import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { User, UserRole } from '../../users/schemas/user.schema.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AdminQueryReportsDto, UpdateReportStatusDto } from '../dto/reports.dto.js';
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

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() actor: User & { _id: any },
  ) {
    return { success: true, data: await this.reports.updateStatus(id, dto, actor as any) };
  }
}
