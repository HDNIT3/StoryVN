/** Kết quả trả về sau khi tải ảnh lên thành công từ Backend */
export interface UploadResult {
  url: string;
  path: string;
  relativePath?: string;
  publicId?: string;
  originalName: string;
  size: number;
  mimeType: string;
  storage: "cloud" | "local";
}

/** Phản hồi từ API upload ảnh */
export interface UploadApiResponse {
  success: boolean;
  message: string;
  data: UploadResult;
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
  source: "cloud" | "local";
  createdAt: string;
}

export interface PaginatedMedia {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryMediaParams {
  page?: number;
  limit?: number;
  source?: "all" | "cloud" | "local";
}

export interface MediaApiResponse {
  success: boolean;
  message: string;
  data: PaginatedMedia;
}
