import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SystemConfigService } from '../services/system-config.service.js';

@ApiTags('System Config')
@Controller('system-config')
export class PublicSystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get('footer')
  async getFooter() {
    const data = await this.systemConfigService.getFooter();
    return { success: true, data };
  }
}
