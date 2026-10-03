import {
  BadRequestException,
  Controller,
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
}
