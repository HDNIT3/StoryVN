import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
import { RateLimit } from '../../common/guards/rate-limit.guard.js';
import { UploadService } from './upload.service.js';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @ApiOperation({ summary: 'Tải lên hình ảnh (tự động chuyển đổi giữa Local và Cloudinary)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    example: 'avatars',
    description: 'Thư mục phân loại ảnh (avatars, covers, chapters...)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File hình ảnh (JPG, PNG, WEBP, GIF, tối đa 5MB)',
        },
      },
    },
  })
  @RateLimit(3, 60) // 3 lần/phút - chống flood upload ảnh
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm file hình ảnh');
    }
    const result = await this.uploadService.uploadImage(file, folder || 'images');
    return {
      success: true,
      message: 'Tải lên hình ảnh thành công',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Lấy danh sách tất cả hình ảnh (Cloud & Local) có phân trang' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('media')
  @HttpCode(HttpStatus.OK)
  async getAllMedia(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '40',
    @Query('source') source: 'all' | 'cloud' | 'local' = 'all',
  ) {
    const data = await this.uploadService.getAllMedia(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 40,
      source,
    );
    return {
      success: true,
      message: 'Lấy danh sách hình ảnh thành công',
      data,
    };
  }
}
