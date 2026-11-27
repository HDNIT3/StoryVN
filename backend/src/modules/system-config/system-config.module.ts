import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { PublicSystemConfigController } from './controllers/public-system-config.controller.js';
import { SystemConfigController } from './controllers/system-config.controller.js';

import { SystemConfigSchema } from './schemas/system-config.schema.js';
import { SystemConfigService } from './services/system-config.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'SystemConfig', schema: SystemConfigSchema }]),
  ],
  controllers: [SystemConfigController, PublicSystemConfigController],
  providers: [SystemConfigService],
})
export class SystemConfigModule {}
