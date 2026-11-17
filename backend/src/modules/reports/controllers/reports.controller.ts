import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { SubmitReportDto } from '../dto/reports.dto.js';
import { ReportsService } from '../services/reports.service.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @HttpCode(200)
  async submit(@CurrentUser() user: { _id: Types.ObjectId }, @Body() dto: SubmitReportDto) {
    return { success: true, data: await this.reports.submit(user._id.toString(), dto) };
  }
}
