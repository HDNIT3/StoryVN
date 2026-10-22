"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { readingHistoryService } from "../services/reading-history.service";
import { readingHistoryKeys } from "./reading-history.keys";
import type { QueryReadingHistoryParams } from "../types";

export function useMyReadingHistory(
  params: QueryReadingHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: readingHistoryKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await readingHistoryService.getMyHistory(params);
      return res.data;
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useMyStoryReadingHistory(storyId: string, enabled = true) {
  return useQuery({
    queryKey: readingHistoryKeys.story(storyId),
    queryFn: async () => {
      const res = await readingHistoryService.getMyStoryHistory(storyId);
      return res.data;
    },
    enabled: Boolean(storyId) && enabled,
  });
}

export function useRecordReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterId: string) => {
      const res = await readingHistoryService.recordReading(chapterId);
      return res.data;
    },
    onSuccess: (data) => {
      if (!data?.recorded) return;
      queryClient.invalidateQueries({ queryKey: readingHistoryKeys.all });
    },
  });
}
