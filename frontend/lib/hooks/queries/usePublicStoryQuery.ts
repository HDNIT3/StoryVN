"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import publicStoryService from "@/lib/services/public-story.service";
import type { QueryPublicStoriesParams } from "@/types/public-story";
import { toast } from "@/lib/toast";

// ── Lấy danh sách truyện công khai ──────────────────────────────────────────
export function usePublicStories(params?: QueryPublicStoriesParams) {
  return useQuery({
    queryKey: queryKeys.publicStories.list(params),
    queryFn: async () => {
      const res = await publicStoryService.getPublicStories(params);
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 phút
  });
}

// ── Top truyện theo lượt xem ─────────────────────────────────────────────────
export function useTopStoriesByViews(limit = 10) {
  return useQuery({
    queryKey: queryKeys.publicStories.topViews(limit),
    queryFn: async () => {
      const res = await publicStoryService.getTopByViews(limit);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  });
}

// ── Top truyện theo lượt like ────────────────────────────────────────────────
export function useTopStoriesByLikes(limit = 10) {
  return useQuery({
    queryKey: queryKeys.publicStories.topLikes(limit),
    queryFn: async () => {
      const res = await publicStoryService.getTopByLikes(limit);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Chi tiết truyện ──────────────────────────────────────────────────────────
export function usePublicStoryDetail(slugOrId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicStories.detail(slugOrId),
    queryFn: async () => {
      const res = await publicStoryService.getStoryDetail(slugOrId);
      return res.data;
    },
    enabled: enabled && !!slugOrId,
    staleTime: 1000 * 60 * 1, // 1 phút
  });
}

// ── Toggle Like ───────────────────────────────────────────────────────────────
export function useToggleLike(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publicStoryService.toggleLike(storyId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.publicStories.detail(storyId) });
      qc.invalidateQueries({ queryKey: ["user", "library"] });
      toast.success(res.message || (res.data.liked ? "Đã like truyện" : "Đã bỏ like"));
    },
    onError: () => {
      toast.error("Vui lòng đăng nhập để like truyện");
    },
  });
}

// ── Toggle Follow ─────────────────────────────────────────────────────────────
export function useToggleFollow(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publicStoryService.toggleFollow(storyId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.publicStories.detail(storyId) });
      qc.invalidateQueries({ queryKey: ["user", "library"] });
      toast.success(res.message || (res.data.followed ? "Đã theo dõi" : "Đã bỏ theo dõi"));
    },
    onError: () => {
      toast.error("Vui lòng đăng nhập để theo dõi truyện");
    },
  });
}

// ── Rate Story ────────────────────────────────────────────────────────────────
export function useRateStory(storyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (score: number) => publicStoryService.rateStory(storyId, score),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.publicStories.detail(storyId) });
      qc.invalidateQueries({ queryKey: ["user", "library"] });
      toast.success("Đánh giá truyện thành công!");
    },
    onError: () => {
      toast.error("Vui lòng đăng nhập để đánh giá truyện");
    },
  });
}

// ── Lấy danh sách truyện user đã like ─────────────────────────────────────────
export function useMyLikedStories(enabled = true) {
  return useQuery({
    queryKey: ["user", "library", "likes"],
    queryFn: async () => {
      const res = await publicStoryService.getMyLikes();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 30,
  });
}

// ── Lấy danh sách truyện user đang theo dõi ──────────────────────────────────
export function useMyFollowedStories(enabled = true) {
  return useQuery({
    queryKey: ["user", "library", "follows"],
    queryFn: async () => {
      const res = await publicStoryService.getMyFollows();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 30,
  });
}

// ── Lấy danh sách truyện user đã đánh giá ────────────────────────────────────
export function useMyRatedStories(enabled = true) {
  return useQuery({
    queryKey: ["user", "library", "ratings"],
    queryFn: async () => {
      const res = await publicStoryService.getMyRatings();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 30,
  });
}
