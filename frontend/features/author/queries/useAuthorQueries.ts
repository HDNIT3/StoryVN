"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { authorService } from "../services/author.service";
import { authorRequestService } from "../services/author-request.service";
import { authorKeys, authorRequestKeys } from "./author.keys";
import { useAuth } from "@/lib/context/AuthContext";

export function useAuthorAnalytics(range: { startDate?: string; endDate?: string } = {}, storyId?: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['author', 'analytics', user?._id, storyId || 'all', range],
    queryFn: async () => (await authorService.getAnalytics(range, storyId)).data,
    enabled: enabled && !!user,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
import { toast } from "@/lib/toast";
import type {
  CreateAuthorRequestPayload,
  QueryAuthorPublicStoriesParams,
  QueryAuthorsParams,
  QueryAuthorRevenueParams,
} from "../types";

export function useAuthorOverview(range: { startDate?: string; endDate?: string } = {}, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...authorKeys.overview(range), user?._id],
    queryFn: async () => {
      const res = await authorService.getAuthorOverview(range);
      return res.data;
    },
    enabled: enabled && !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCommunityStats() {
  return useQuery({
    queryKey: authorKeys.communityStats,
    queryFn: async () => {
      const res = await authorService.getCommunityStats();
      return res.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useAuthorsList(params?: QueryAuthorsParams) {
  return useQuery({
    queryKey: authorKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await authorService.getAuthorsList(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function usePublicAuthorProfile(slug: string, enabled = true) {
  return useQuery({
    queryKey: authorKeys.profile(slug),
    queryFn: async () => {
      const res = await authorService.getPublicProfile(slug);
      return res.data?.author;
    },
    enabled: Boolean(slug) && enabled,
  });
}

export function usePublicAuthorStories(
  slug: string,
  params?: QueryAuthorPublicStoriesParams,
  enabled = true
) {
  return useQuery({
    queryKey: authorKeys.stories(slug, params as Record<string, unknown>),
    queryFn: async () => {
      const res = await authorService.getPublicStories(slug, params);
      return res.data;
    },
    enabled: Boolean(slug) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMyAuthorStatus(enabled = true) {
  return useQuery({
    queryKey: authorRequestKeys.myStatus,
    queryFn: async () => {
      const res = await authorRequestService.getAuthorProfileAndRequestStatus();
      return res.data;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

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
      queryClient.invalidateQueries({ queryKey: authorRequestKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Gửi yêu cầu thất bại, vui lòng thử lại";
      toast.error(msg);
    },
  });
}

export function useUpdateAuthorRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAuthorRequestPayload) => {
      const res = await authorRequestService.updateRequest(payload);
      return res;
    },
    onSuccess: () => {
      toast.success("Cập nhật yêu cầu thành công!");
      queryClient.invalidateQueries({ queryKey: authorRequestKeys.all });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại, vui lòng thử lại";
      toast.error(msg);
    },
  });
}

export function useAuthorRevenueHistory(
  params?: QueryAuthorRevenueParams,
  enabled = true
) {
  return useQuery({
    queryKey: authorKeys.revenueHistory(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await authorService.getAuthorRevenueHistory(params);
      return res.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}
