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

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  name: string;
  size?: number;
  format?: string;
  width?: number;
  height?: number;
  source: 'cloud' | 'local';
  createdAt: string;
}

export interface PaginatedMedia {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  /**
   * Lấy danh sách tất cả hình ảnh (Cloudinary & Local) với phân trang
   */
  async getAllMedia(
    page: number = 1,
    limit: number = 40,
    source: 'all' | 'cloud' | 'local' = 'all',
  ): Promise<PaginatedMedia> {
    const promises: Promise<MediaItem[]>[] = [];

    if (source === 'all' || source === 'local') {
      promises.push(this.getLocalImages());
    }
    if (source === 'all' || source === 'cloud') {
      promises.push(this.getCloudinaryImages());
    }

    const results = await Promise.all(promises);
    const allImages = results.flat();

    // Sắp xếp ảnh mới nhất lên đầu
    allImages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = allImages.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const offset = (currentPage - 1) * limit;
    const paginatedItems = allImages.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page: currentPage,
      limit,
      totalPages,
    };
  }

  private async getLocalImages(): Promise<MediaItem[]> {
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    const appUrl = (this.configService.get<string>('APP_URL') || '').replace(/\/$/, '');
    const items: MediaItem[] = [];

    const walkDir = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'].includes(ext)) {
              const stat = await fs.stat(fullPath);
              const relative = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
              const relUrl = `/${relative}`;
              const fullUrl = appUrl ? `${appUrl}${relUrl}` : relUrl;
              items.push({
                id: `local-${entry.name}`,
                url: fullUrl,
                thumbnailUrl: fullUrl,
                name: entry.name,
                size: stat.size,
                format: ext.replace('.', ''),
                source: 'local',
                createdAt: stat.mtime.toISOString(),
              });
            }
          }
        }
      } catch {
        // bỏ qua nếu thư mục chưa tồn tại
      }
    };

    await walkDir(uploadsRoot);
    return items;
  }

  private async getCloudinaryImages(): Promise<MediaItem[]> {
    try {
      const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
      const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
      const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

      if (!cloudName || !apiKey || !apiSecret) {
        return [];
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      const res = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 500,
      });

      if (!res.resources || !Array.isArray(res.resources)) {
        return [];
      }

      return res.resources.map((r: any) => {
        const secureUrl = r.secure_url;
        let thumbUrl = secureUrl;
        if (secureUrl.includes('/upload/')) {
          thumbUrl = secureUrl.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto,f_auto/');
        }

        return {
          id: r.public_id,
          url: secureUrl,
          thumbnailUrl: thumbUrl,
          name: path.basename(r.public_id),
          size: r.bytes,
          format: r.format,
          width: r.width,
          height: r.height,
          source: 'cloud',
          createdAt: r.created_at || new Date().toISOString(),
        };
      });
    } catch (err) {
      this.logger.error('Lỗi khi lấy danh sách ảnh từ Cloudinary:', err);
      return [];
    }
  }
}
