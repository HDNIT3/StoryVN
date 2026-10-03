import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authorRequestService } from "@/lib/services/author-request.service";
import type { CreateAuthorRequestPayload } from "@/types/author";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "@/lib/toast";

/**
 * Hook lấy trạng thái đăng ký tác giả của người dùng hiện tại
 */
export function useMyAuthorStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.authorRequest.myStatus,
    queryFn: async () => {
      const res = await authorRequestService.getAuthorProfileAndRequestStatus();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

/**
 * Mutation Gửi yêu cầu đăng ký tác giả mới
 */
export function useCreateAuthorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAuthorRequestPayload) => {
      const res = await authorRequestService.createRequest(payload);
      return res;
    },
    onSuccess: () => {
      toast.success(
        "Gửi yêu cầu nâng cấp tác giả thành công! Chúng tôi sẽ xét duyệt sớm nhất."
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.authorRequest.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.authorStatus });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Gửi yêu cầu thất bại, vui lòng thử lại");
    },
  });
}

/**
 * Mutation Cập nhật yêu cầu đăng ký tác giả
 */
export function useUpdateAuthorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAuthorRequestPayload) => {
      const res = await authorRequestService.updateRequest(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật yêu cầu thành công!");
      queryClient.invalidateQueries({ queryKey: queryKeys.authorRequest.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.authorStatus });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Cập nhật thất bại, vui lòng thử lại");
    },
  });
}
