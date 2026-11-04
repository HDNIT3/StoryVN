import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { CoinPackage, CoinPackageSchema } from '../coin-packages/schemas/coin-package.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { UsersModule } from '../users/users.module.js';
import { WalletModule } from '../wallet/wallet.module.js';
import { PaymentsController } from './controllers/payments.controller.js';
import { Transaction, TransactionSchema } from './schemas/transaction.schema.js';
import { PaymentsService } from './services/payments.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: CoinPackage.name, schema: CoinPackageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    UsersModule,
    WalletModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

