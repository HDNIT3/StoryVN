import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import {
  RankingsQueryDto,
  RecommendationsQueryDto,
} from '../dto/discovery.dto.js';
import { DiscoveryService } from '../services/discovery.service.js';

@Controller('stories')
@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Public()
  @Get('rankings')
  async rankings(@Query() query: RankingsQueryDto) {
    return { success: true, data: await this.discovery.rankings(query) };
  }

  @Public()
  @Get('rankings/authors')
  async authorRankings(@Query() query: RankingsQueryDto) {
    return {
      success: true,
      data: await this.discovery.authorRankings(query),
    };
  }

  @Get('recommendations')
  @Header('Cache-Control', 'private, no-store')
  async recommendations(
    @CurrentUser('_id') userId: string,
    @Query() query: RecommendationsQueryDto,
  ) {
    return {
      success: true,
      data: await this.discovery.recommendations(String(userId), query),
    };
  }
}
