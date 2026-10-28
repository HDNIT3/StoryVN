import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { ratingService } from "../services/rating.service";
import type { CreateRatingInput, QueryRatingsParams } from "../types";

export const ratingKeys = {
  all: ["ratings"] as const,
  lists: () => [...ratingKeys.all, "list"] as const,
  list: (storyId: string, params?: QueryRatingsParams) =>
    [...ratingKeys.lists(), storyId, params] as const,
  summary: (storyId: string) => [...ratingKeys.all, "summary", storyId] as const,
  myRating: (storyId: string) => [...ratingKeys.all, "me", storyId] as const,
};

export function useStoryRatings(storyId: string, params?: QueryRatingsParams) {
  return useQuery({
    queryKey: ratingKeys.list(storyId, params),
    queryFn: () => ratingService.getStoryRatings(storyId, params),
    enabled: !!storyId,
  });
}

export function useRatingSummary(storyId: string) {
  return useQuery({
    queryKey: ratingKeys.summary(storyId),
    queryFn: () => ratingService.getRatingSummary(storyId),
    enabled: !!storyId,
  });
}

export function useMyRating(storyId: string, isAuthenticated: boolean) {
  return useQuery({
    queryKey: ratingKeys.myRating(storyId),
    queryFn: () => ratingService.getMyRating(storyId),
    enabled: !!storyId && isAuthenticated,
  });
}

export function useRateStory(storyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRatingInput) =>
      ratingService.rateStory(storyId, payload),
    onSuccess: () => {
      toast.success("Cập nhật đánh giá truyện thành công");
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Đánh giá truyện thất bại");
    },
  });
}

export function useDeleteMyRating(storyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ratingService.deleteMyRating(storyId),
    onSuccess: () => {
      toast.success("Đã xóa đánh giá của bạn");
      queryClient.invalidateQueries({ queryKey: ratingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Xóa đánh giá thất bại");
    },
  });
}

