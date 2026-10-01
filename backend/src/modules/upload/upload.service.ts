import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  path: string;
  relativePath?: string;
  publicId?: string;
  originalName: string;
  size: number;
  mimeType: string;
  storage: 'cloud' | 'local';
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isCloud: boolean;

  constructor(private readonly configService: ConfigService) {
    const uploadCloudVal = this.configService.get<string>('UPLOAD_CLOUD');
    this.isCloud =
      uploadCloudVal?.toString().trim().toLowerCase() === 'true';

    if (this.isCloud) {
      cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      });
      this.logger.log('Upload Service: Đang hoạt động ở chế độ CLOUD (Cloudinary)');
    } else {
      this.logger.log('Upload Service: Đang hoạt động ở chế độ LOCAL (/uploads)');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    subfolder: string = 'images',
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file hình ảnh để tải lên');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/jpg',
    ];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException(
        'Định dạng file không hợp lệ. Chỉ chấp nhận các định dạng: JPG, PNG, WEBP, GIF',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Kích thước file vượt quá giới hạn cho phép (tối đa 5MB)',
      );
    }

    const uploadCloudVal = this.configService.get<string>('UPLOAD_CLOUD');
    const isCloudMode =
      uploadCloudVal?.toString().trim().toLowerCase() === 'true';

    if (isCloudMode) {
      return this.uploadToCloudinary(file, subfolder);
    }
    return this.uploadToLocal(file, subfolder);
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    subfolder: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `storyvn/${subfolder}`,
          resource_type: 'image',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error('Lỗi khi tải ảnh lên Cloudinary:', error);
            return reject(
              new InternalServerErrorException(
                `Lỗi khi tải ảnh lên Cloudinary: ${error?.message || 'Không xác định'}`,
              ),
            );
          }
          resolve({
            url: result.secure_url,
            path: result.secure_url,
            relativePath: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            storage: 'cloud',
          });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Lưu file vào thư mục cục bộ /uploads/<subfolder>/
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    subfolder: string,
  ): Promise<UploadResult> {
    const targetDir = path.join(process.cwd(), 'uploads', subfolder);

    // Tạo thư mục nếu chưa tồn tại
    await fs.mkdir(targetDir, { recursive: true });

    // Đặt tên file ngẫu nhiên để tránh trùng lặp
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(targetDir, uniqueName);

    // Ghi buffer vào file
    await fs.writeFile(filePath, file.buffer);

    // Xây dựng đường dẫn URL
    const appUrl = (
      this.configService.get<string>('APP_URL') || ''
    ).replace(/\/$/, '');
    const relativePath = `/uploads/${subfolder}/${uniqueName}`;
    const fullUrl = appUrl ? `${appUrl}${relativePath}` : relativePath;

    return {
      url: fullUrl,
      path: relativePath,
      relativePath,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storage: 'local',
    };
  }
}
