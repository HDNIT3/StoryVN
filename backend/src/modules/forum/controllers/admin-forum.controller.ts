import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { QueryReportsDto } from '../../reports/dto/reports.dto.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { AdminQueryForumPostsDto, UpdateForumPostStatusDto } from '../dto/forum.dto.js';
import { ForumService } from '../services/forum.service.js';
import { DateRangeQueryDto } from '../../../common/dto/date-range.dto.js';

@ApiTags('Admin Forum')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/forum/posts')
export class AdminForumController {
  constructor(private readonly forum: ForumService) {}

  @Get()
  async list(@Query() query: AdminQueryForumPostsDto) {
    return { success: true, data: await this.forum.adminList(query) };
  }

  @Get('stats')
  async stats(@Query() query: DateRangeQueryDto) {
    return { success: true, data: await this.forum.stats(query) };
  }

  @Patch(':id/status')
  async status(@Param('id') id: string, @Body() dto: UpdateForumPostStatusDto) {
    return { success: true, data: await this.forum.setStatus(id, dto.status) };
  }

  @Get(':id/reports')
  async reports(@Param('id') id: string, @Query() query: QueryReportsDto) {
    return { success: true, data: await this.forum.reports(id, query) };
  }
}
