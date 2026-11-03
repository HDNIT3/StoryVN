import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { UsersModule } from '../users/users.module.js';
import { CoinPackagesController } from './controllers/coin-packages.controller.js';
import { CoinPackage, CoinPackageSchema } from './schemas/coin-package.schema.js';
import { CoinPackagesService } from './services/coin-packages.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoinPackage.name, schema: CoinPackageSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [CoinPackagesController],
  providers: [CoinPackagesService],
  exports: [CoinPackagesService],
})
export class CoinPackagesModule {}
