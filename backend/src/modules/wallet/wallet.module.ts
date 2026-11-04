import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { AdminWalletController } from './controllers/admin-wallet.controller.js';
import { WalletController } from './controllers/wallet.controller.js';
import { Wallet, WalletSchema } from './schemas/wallet.schema.js';
import { WalletService } from './services/wallet.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WalletController, AdminWalletController],
  providers: [WalletService],
  exports: [WalletService, MongooseModule],
})
export class WalletModule {}
