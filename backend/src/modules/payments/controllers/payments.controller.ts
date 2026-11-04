import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreatePaymentDto } from '../dto/create-payment.dto.js';
import { QueryMyTransactionsDto } from '../dto/query-my-transactions.dto.js';
import { QueryTransactionsDto } from '../dto/query-transactions.dto.js';
import { PaymentsService } from '../services/payments.service.js';
import { getClientIp } from '../utils/vnpay.util.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Tạo URL thanh toán VNPay Sandbox cho gói Xu' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('vnpay-create')
  @HttpCode(HttpStatus.OK)
  async createVnpayPayment(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const clientIp = getClientIp(req);
    const data = await this.paymentsService.createVnpayPayment(String(userId), dto, clientIp);
    return {
      success: true,
      message: 'Tạo URL thanh toán VNPay thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách giao dịch cho Admin (phân trang, lọc, tìm kiếm, thống kê)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('admin/transactions')
  @HttpCode(HttpStatus.OK)
  async adminGetTransactions(@Query() dto: QueryTransactionsDto) {
    const data = await this.paymentsService.adminGetTransactions(dto);
    return {
      success: true,
      message: 'Lấy danh sách giao dịch thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xử lý Return URL chuyển hướng từ VNPay sau thanh toán' })
  @Get('vnpay-return')
  async handleVnpayReturn(
    @Query() query: Record<string, any>,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const result = await this.paymentsService.handleVnpayReturn(query);

    const orderCode = result.orderCode || query['vnp_TxnRef'] || '';
    const redirectUrl = `${frontendUrl}/payments/vnpay-return?orderCode=${encodeURIComponent(orderCode)}`;

    return res.redirect(redirectUrl);
  }

  @ApiOperation({ summary: 'Xử lý IPN Callback ngầm từ máy chủ VNPay' })
  @Get('vnpay-ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleVnpayIpn(query);
  }

  @ApiOperation({ summary: 'Lấy lịch sử thanh toán của tôi (phân trang, lọc trạng thái, tìm mã đơn)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  async getMyTransactions(
    @CurrentUser('_id') userId: string,
    @Query() dto: QueryMyTransactionsDto,
  ) {
    const data = await this.paymentsService.getMyTransactions(String(userId), dto);
    return {
      success: true,
      message: 'Lấy lịch sử thanh toán thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy trạng thái và chi tiết giao dịch theo mã đơn hàng' })
  @Get('transactions/:orderCode')
  @HttpCode(HttpStatus.OK)
  async getTransactionDetails(
    @Param('orderCode') orderCode: string,
    @Query() query: Record<string, any>,
  ) {
    const data = await this.paymentsService.getTransactionByOrderCode(orderCode, query);
    return {
      success: true,
      message: 'Lấy thông tin giao dịch thành công',
      data,
    };
  }
}

