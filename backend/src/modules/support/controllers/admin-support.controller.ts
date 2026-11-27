import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import {
  AdminQuerySupportTicketsDto,
  AdminReplySupportTicketDto,
  AdminUpdateSupportTicketDto,
} from '../dto/support-ticket.dto.js';
import { SupportService } from '../services/support.service.js';

@ApiTags('Admin Support')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('stats')
  async stats() {
    return {
      success: true,
      data: await this.supportService.adminGetStats(),
    };
  }

  @Get()
  async list(@Query() query: AdminQuerySupportTicketsDto) {
    return {
      success: true,
      data: await this.supportService.adminList(query),
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return {
      success: true,
      data: await this.supportService.adminGetDetail(id),
    };
  }

  @Post(':id/reply')
  @HttpCode(200)
  async reply(
    @Param('id') id: string,
    @Body() dto: AdminReplySupportTicketDto,
    @CurrentUser() adminUser: { _id: Types.ObjectId; displayName?: string },
  ) {
    return {
      success: true,
      data: await this.supportService.adminReply(id, dto, adminUser),
    };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: AdminUpdateSupportTicketDto) {
    return {
      success: true,
      data: await this.supportService.adminUpdateStatus(id, dto),
    };
  }
}
