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
