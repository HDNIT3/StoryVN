import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { AdjustWalletDto } from '../dto/adjust-wallet.dto.js';
import { QueryWalletsDto } from '../dto/query-wallets.dto.js';
import { WalletService } from '../services/wallet.service.js';

@ApiTags('Wallet Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Controller('wallet/admin')
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({ summary: 'Danh sách ví người dùng (tìm kiếm, phân trang, sắp xếp)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getWallets(@Query() query: QueryWalletsDto) {
    const data = await this.walletService.adminGetWallets(query);
    return {
      success: true,
      message: 'Lấy danh sách ví thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Cộng/trừ Xu thủ công cho người dùng' })
  @Post(':userId/adjust')
  @HttpCode(HttpStatus.OK)
  async adjustWallet(
    @Param('userId') userId: string,
    @Body() dto: AdjustWalletDto,
  ) {
    const data = await this.walletService.adminAdjustWallet(userId, dto);
    return {
      success: true,
      message: 'Điều chỉnh số Xu trong ví thành công',
      data,
    };
  }
}
