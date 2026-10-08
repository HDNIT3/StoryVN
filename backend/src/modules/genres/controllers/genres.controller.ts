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
import { CreateGenreDto } from '../dto/create-genre.dto.js';
import { QueryGenreDto } from '../dto/query-genre.dto.js';
import { UpdateGenreDto } from '../dto/update-genre.dto.js';
import { GenresService } from '../services/genres.service.js';

@ApiTags('Categories')
@Controller(['categories', 'genres'])
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @ApiOperation({ summary: 'Khởi tạo danh sách thể loại mặc định (Seed Data)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed() {
    const data = await this.genresService.seedDefault();
    return {
      success: true,
      message: `Khởi tạo dữ liệu thể loại thành công: ${data.createdCount} mới, ${data.skippedCount} đã tồn tại`,
      data,
    };
  }

  @ApiOperation({ summary: 'Tạo mới thể loại / danh mục' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGenreDto) {
    const data = await this.genresService.create(dto);
    return {
      success: true,
      message: 'Tạo thể loại thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách thể loại / danh mục (phân trang, lọc, tìm kiếm)' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryGenreDto) {
    const data = await this.genresService.findAll(query);
    return {
      success: true,
      message: 'Lấy danh sách thể loại thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xem chi tiết thể loại / danh mục theo ID' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const data = await this.genresService.findById(id);
    return {
      success: true,
      message: 'Lấy chi tiết thể loại thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Cập nhật thông tin thể loại / danh mục theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    const data = await this.genresService.update(id, dto);
    return {
      success: true,
      message: 'Cập nhật thể loại thành công',
      data,
    };
  }

  @ApiOperation({ summary: 'Xóa thể loại / danh mục theo ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.genresService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
