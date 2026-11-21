import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../common/guards/rate-limit.guard.js';
import { SearchSuggestDto } from '../dto/search-suggest.dto.js';
import { SearchService } from '../services/search.service.js';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}
  @ApiOperation({ summary: 'Gợi ý truyện theo từ khóa và ngữ nghĩa' })
  @Get('suggest')
  @RateLimit(120, 60)
  async suggest(@Query() query: SearchSuggestDto) {
    return {
      success: true,
      data: await this.search.suggest(query.q),
      message: 'Gợi ý truyện',
    };
  }
}
