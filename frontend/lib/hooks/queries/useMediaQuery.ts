import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { uploadService } from "@/lib/services/upload.service";
import { queryKeys } from "@/lib/query-keys";
import type { QueryMediaParams } from "@/types/upload";

/**
 * Hook lấy danh sách hình ảnh từ Cloudinary & Local có phân trang
 */
export function useMediaList(params?: QueryMediaParams) {
  return useQuery({
    queryKey: queryKeys.media.list(params),
    queryFn: async () => {
      const res = await uploadService.getAllMedia(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 3, // Cache 3 phút
  });
}
