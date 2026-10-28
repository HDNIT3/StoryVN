import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { commentService } from "../services/comment.service";
import type {
  CreateCommentInput,
  QueryCommentsParams,
  QueryRepliesParams,
  UpdateCommentInput,
} from "../types";

export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (storyId: string, params?: QueryCommentsParams) =>
    [...commentKeys.lists(), storyId, params] as const,
  replies: (parentId: string, params?: QueryRepliesParams) =>
    [...commentKeys.all, "replies", parentId, params] as const,
  detail: (commentId: string) => [...commentKeys.all, "detail", commentId] as const,
};

export function useStoryComments(storyId: string, params?: QueryCommentsParams) {
  return useQuery({
    queryKey: commentKeys.list(storyId, params),
    queryFn: () => commentService.getStoryComments(storyId, params),
    enabled: !!storyId,
  });
}

export function useCommentReplies(parentId: string, params?: QueryRepliesParams) {
  return useQuery({
    queryKey: commentKeys.replies(parentId, params),
    queryFn: () => commentService.getCommentReplies(parentId, params),
    enabled: !!parentId,
  });
}

export function useCommentDetail(commentId?: string | null) {
  return useQuery({
    queryKey: commentKeys.detail(commentId || ""),
    queryFn: () => commentService.getCommentById(commentId!),
    enabled: !!commentId,
  });
}

export function useCreateComment(storyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentInput) =>
      commentService.createComment(payload),
    onSuccess: () => {
      toast.success("Đăng bình luận thành công");
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Đăng bình luận thất bại");
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      payload,
    }: {
      commentId: string;
      payload: UpdateCommentInput;
    }) => commentService.updateComment(commentId, payload),
    onSuccess: () => {
      toast.success("Cập nhật bình luận thành công");
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Cập nhật bình luận thất bại");
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      toast.success("Xóa bình luận thành công");
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Xóa bình luận thất bại");
    },
  });
}

export function useToggleCommentVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      status,
    }: {
      commentId: string;
      status: "VISIBLE" | "HIDDEN";
    }) => commentService.toggleCommentVisibility(commentId, status),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "VISIBLE"
          ? "Đã hiển thị lại bình luận"
          : "Đã ẩn bình luận"
      );
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Thao tác ẩn/hiện bình luận thất bại");
    },
  });
}

