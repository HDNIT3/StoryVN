import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import type { UserDocument } from '../../users/schemas/user.schema.js';
import { CompleteWithdrawalDto } from '../dto/complete-withdrawal.dto.js';
import { WithdrawalNoteDto } from '../dto/withdrawal-note.dto.js';
import { WithdrawalQueryDto } from '../dto/query-withdrawals.dto.js';
import { WithdrawalsService } from '../services/withdrawals.service.js';

const response = (data: unknown) => ({ success: true, data });

@ApiTags('Admin withdrawals')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('admin/withdrawals')
export class AdminWithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  @Get()
  async list(@Query() query: WithdrawalQueryDto) {
    return response(await this.service.list(query));
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return response(await this.service.detail(id));
  }

  @Post(':id/process')
  async process(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return response(
      await this.service.transition(
        id,
        String(user._id),
        'process',
        '',
        '',
        user.role,
      ),
    );
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: WithdrawalNoteDto,
  ) {
    return response(
      await this.service.transition(
        id,
        String(user._id),
        'reject',
        dto.note,
        '',
        user.role,
      ),
    );
  }

  @Post(':id/notes')
  async notes(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: WithdrawalNoteDto,
  ) {
    return response(
      await this.service.transition(
        id,
        String(user._id),
        'notes',
        dto.note,
        '',
        user.role,
      ),
    );
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: CompleteWithdrawalDto,
  ) {
    return response(
      await this.service.transition(
        id,
        String(user._id),
        'complete',
        dto.note,
        dto.transactionCode,
        user.role,
      ),
    );
  }
}
