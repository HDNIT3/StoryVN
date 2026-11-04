import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { WalletService } from '../services/wallet.service.js';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({
    summary: 'Lấy thông tin ví của tôi (số Xu hiện có, tổng Xu đã dùng, lần cập nhật gần nhất)',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyWallet(@CurrentUser('_id') userId: string) {
    const data = await this.walletService.getMyWallet(String(userId));
    return {
      success: true,
      message: 'Lấy thông tin ví thành công',
      data,
    };
  }
}
