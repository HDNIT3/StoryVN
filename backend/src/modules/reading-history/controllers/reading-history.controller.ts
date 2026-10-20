import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { User } from '../../users/schemas/user.schema.js';
import { QueryReadingHistoryDto } from '../dto/query-reading-history.dto.js';
import { RecordReadingHistoryDto } from '../dto/record-reading-history.dto.js';
import { ReadingHistoryService } from '../services/reading-history.service.js';

@ApiTags('Reading History')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reading-history')
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @ApiOperation({
    summary: 'Ghi nhận một lần đọc chương',
    description:
      'Gọi khi người dùng mở một chương. Mỗi lần đọc tạo một bản ghi mới (đọc lại cùng chương vẫn tạo bản ghi mới), riêng trường hợp mở lại cùng chương trong vòng 5 phút thì bỏ qua để tránh nhân bản khi F5. Trả về recorded = false nếu bị bỏ qua.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async record(
    @CurrentUser() user: User & { _id: any },
    @Body() dto: RecordReadingHistoryDto,
  ) {
    const data = await this.readingHistoryService.recordChapter(
      user._id.toString(),
      dto.chapterId,
    );

    return {
      success: true,
      message: data.recorded
        ? 'Ghi nhận lịch sử đọc thành công'
        : 'Chương này vừa được ghi nhận, bỏ qua bản ghi trùng',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy danh sách lịch sử đọc của tôi',
    description:
      'Gom theo truyện (mỗi truyện một dòng, mới đọc nhất trước) kèm tiến độ, chương đang đọc và tối đa 3 chương gần đây. Hỗ trợ tìm kiếm theo tên truyện, lọc theo thể loại / trạng thái đọc / số chương đã đọc / khoảng thời gian.',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyHistory(
    @CurrentUser() user: User & { _id: any },
    @Query() query: QueryReadingHistoryDto,
  ) {
    const data = await this.readingHistoryService.findAllForUser(
      user._id.toString(),
      query,
    );

    return {
      success: true,
      message: 'Lấy lịch sử đọc thành công',
      data,
    };
  }

  @ApiOperation({
    summary: 'Lấy chi tiết lịch sử đọc của tôi với một truyện',
    description:
      'Trả về tiến độ và danh sách chương đã đọc của truyện (mỗi chương một dòng, gộp trùng, kèm lần đọc đầu / lần đọc gần nhất / số lần đọc). Trả về data = null nếu chưa từng đọc truyện này.',
  })
  @Get(':storyId')
  @HttpCode(HttpStatus.OK)
  async getMyStoryHistory(
    @CurrentUser() user: User & { _id: any },
    @Param('storyId') storyId: string,
  ) {
    const data = await this.readingHistoryService.findOneForStory(
      user._id.toString(),
      storyId,
    );

    return {
      success: true,
      message: 'Lấy chi tiết lịch sử đọc thành công',
      data,
    };
  }
}
