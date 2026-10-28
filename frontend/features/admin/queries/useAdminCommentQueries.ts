import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { adminCommentService } from "../services/admin-comment.service";
import { adminKeys } from "./admin.keys";
import type {
  AdminCommentStatus,
  QueryAdminCommentsParams,
} from "../types/comment.types";

export function useAdminComments(params?: QueryAdminCommentsParams) {
  return useQuery({
    queryKey: adminKeys.comments(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminCommentService.getComments(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminCommentCounts() {
  return useQuery({
    queryKey: adminKeys.commentCounts,
    queryFn: async () => {
      const res = await adminCommentService.getCounts();
      return res.data;
    },
  });
}

export function useUpdateCommentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      status,
    }: {
      commentId: string;
      status: AdminCommentStatus;
    }) => adminCommentService.updateStatus(commentId, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái bình luận thành công");
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Cập nhật trạng thái bình luận thất bại");
    },
  });
}

export function useDeleteCommentPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      adminCommentService.deletePermanent(commentId),
    onSuccess: () => {
      toast.success("Xóa vĩnh viễn bình luận thành công");
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Xóa bình luận thất bại");
    },
  });
}

