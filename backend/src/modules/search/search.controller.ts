import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RateLimit } from '../../common/guards/rate-limit.guard.js';
import { UserRole } from '../users/schemas/user.schema.js';
import { SearchIndexService } from './search-index.service.js';
import { SearchQueryDto } from './search-query.dto.js';
import { SearchService } from './search.service.js';

@ApiTags('Search (opt-in pilot)')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('suggest')
  @RateLimit(120, 60)
  @ApiOperation({ summary: 'Tìm truyện theo câu đang nhập; frontend debounce 300 ms' })
  async suggest(@Query() query: SearchQueryDto) {
    return { success: true, message: 'Gợi ý truyện', data: await this.search.suggest(query) };
  }

  @Get()
  @RateLimit(60, 60)
  @ApiOperation({ summary: 'Tìm kiếm kết hợp, tối đa 20 truyện (không phân trang)' })
  async find(@Query() query: SearchQueryDto) {
    return { success: true, message: 'Kết quả tìm kiếm', data: await this.search.suggest(query, 20) };
  }
}

@ApiTags('Admin Search (opt-in pilot)')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/search')
export class AdminSearchController {
  constructor(private readonly index: SearchIndexService) {}

  @Get('status')
  @ApiOperation({ summary: 'Trạng thái chỉ mục thử nghiệm' })
  status() {
    return { success: true, message: 'Trạng thái chỉ mục', data: this.index.status() };
  }

  @Post('reindex')
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit(2, 60)
  @ApiOperation({ summary: 'Yêu cầu đồng bộ chỉ mục riêng, không sửa dữ liệu truyện' })
  reindex() {
    const started = this.index.startRefresh();
    return { success: true, message: started ? 'Đã bắt đầu đồng bộ' : 'Đã có tác vụ đang chạy', data: { started, ...this.index.status() } };
  }
}
