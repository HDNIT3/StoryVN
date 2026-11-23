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
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto.js';
import { WithdrawalQueryDto } from '../dto/query-withdrawals.dto.js';
import { WithdrawalsService } from '../services/withdrawals.service.js';

const response = (data: unknown) => ({ success: true, data });

@ApiTags('Author withdrawals')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.MANAGER)
@Controller('authors/me')
export class AuthorWithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  @Get('earnings')
  async summary(@CurrentUser() user: UserDocument) {
    return response(await this.service.summary(String(user._id)));
  }

  @Get('earnings/history')
  async history(
    @CurrentUser() user: UserDocument,
    @Query() query: WithdrawalQueryDto,
  ) {
    return response(await this.service.history(String(user._id), query));
  }

  @Get('withdrawals')
  async list(
    @CurrentUser() user: UserDocument,
    @Query() query: WithdrawalQueryDto,
  ) {
    return response(await this.service.list(query, String(user._id)));
  }

  @Post('withdrawals')
  async create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return response(
      await this.service.create(String(user._id), dto.idempotencyKey),
    );
  }

  @Get('withdrawals/:id')
  async detail(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return response(await this.service.detail(id, String(user._id)));
  }

  @Post('withdrawals/:id/cancel')
  async cancel(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return response(
      await this.service.transition(id, String(user._id), 'cancel'),
    );
  }
}
