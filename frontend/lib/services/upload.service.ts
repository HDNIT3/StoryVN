import api from "../api";
import type {
  MediaApiResponse,
  QueryMediaParams,
  UploadApiResponse,
  UploadResult,
} from "../../types/upload";

export const uploadService = {
  /**
   * Tải ảnh lên hệ thống qua API backend (/upload/image)
   * Tự động lưu trữ trên Cloudinary (nếu UPLOAD_CLOUD=true) hoặc Local server (/uploads).
   *
   * @param file File hình ảnh (JPG, PNG, WEBP, GIF - tối đa 5MB)
   * @param folder Thư mục phân loại ảnh (ví dụ: 'avatars', 'covers', 'chapters', 'images')
   * @returns Thông tin kết quả upload gồm url, relativePath, publicId,...
   */
  async uploadImage(
    file: File,
    folder: string = "images"
  ): Promise<UploadApiResponse> {
    // Client-side validations
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(
        "Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, GIF"
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Kích thước file vượt quá giới hạn 5MB");
    }

    const formData = new FormData();
    formData.append("file", file);

    const query = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    return api.upload<UploadApiResponse>(`/upload/image${query}`, formData);
  },

  /**
   * Lấy danh sách tất cả hình ảnh (Cloud & Local) có phân trang
   */
  async getAllMedia(
    params?: QueryMediaParams
  ): Promise<MediaApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.source) searchParams.append("source", params.source);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/upload/media?${queryString}` : "/upload/media";
    return api.get<MediaApiResponse>(endpoint);
  },
};

export default uploadService;
