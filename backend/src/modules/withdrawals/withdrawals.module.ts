import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import {
  WithdrawalRequest,
  WithdrawalSchema,
} from './schemas/withdrawal-request.schema.js';
import { AuthorWithdrawalsController } from './controllers/withdrawals.controller.js';
import { AdminWithdrawalsController } from './controllers/admin-withdrawals.controller.js';
import { WithdrawalsService } from './services/withdrawals.service.js';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: WithdrawalRequest.name, schema: WithdrawalSchema },
    ]),
  ],
  controllers: [AuthorWithdrawalsController, AdminWithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
