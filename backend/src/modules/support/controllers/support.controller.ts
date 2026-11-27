import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import {
  CreateSupportTicketDto,
  LookupSupportTicketDto,
  QueryMySupportTicketsDto,
  UserReplySupportTicketDto,
} from '../dto/support-ticket.dto.js';
import { SupportService } from '../services/support.service.js';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Post()
  async create(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser()
    user?: { _id: Types.ObjectId; displayName?: string; email?: string },
  ) {
    return {
      success: true,
      data: await this.supportService.createTicket(dto, user),
    };
  }

  @Get('me')
  async myTickets(
    @CurrentUser() user: { _id: Types.ObjectId; email?: string },
    @Query() query: QueryMySupportTicketsDto,
  ) {
    return {
      success: true,
      data: await this.supportService.getMyTickets(user, query),
    };
  }

  @Public()
  @Get('lookup')
  async lookup(@Query() query: LookupSupportTicketDto) {
    return {
      success: true,
      data: await this.supportService.lookupTicket(query),
    };
  }

  @Public()
  @Post(':ticketCode/reply')
  @HttpCode(200)
  async reply(
    @Param('ticketCode') ticketCode: string,
    @Body() dto: UserReplySupportTicketDto,
    @CurrentUser()
    user?: { _id: Types.ObjectId; displayName?: string; email?: string },
  ) {
    return {
      success: true,
      data: await this.supportService.userReply(ticketCode, dto, user),
    };
  }
}
