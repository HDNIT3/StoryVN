import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../../common/guards/auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CreateTagDto } from '../dto/create-tag.dto.js';
import { QueryTagDto } from '../dto/query-tag.dto.js';
import { UpdateTagDto } from '../dto/update-tag.dto.js';
import { TagsService } from '../services/tags.service.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOperation({ summary: 'Khởi tạo danh sách tag mặc định (Seed Data)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    const data = await this.tagsService.seedDefault();
    return {
      success: true,
      message: `Khởi tạo dữ liệu tag thành công: ${data.createdCount} mới, ${data.skippedCount} đã tồn tại`,
      data,
    };
  }

  @ApiOperation({ summary: 'Tạo mới tag' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTagDto) {
    const data = await this.tagsService.create(dto);
    return {
      success: true,
      message: 'Tạo tag thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách tag (phân trang, lọc, tìm kiếm)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryTagDto) {
    const data = await this.tagsService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách tag thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết tag theo ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.tagsService.findById(id);
    return {
      success: true,
      message: 'Lấy chi tiết tag thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Cập nhật thông tin tag theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    const data = await this.tagsService.update(id, dto);
    return {
      success: true,
      message: 'Cập nhật tag thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa tag theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.tagsService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
