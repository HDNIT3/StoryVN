"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { uploadService } from "../services/upload.service";
import { mediaKeys } from "./media.keys";
import type { QueryMediaParams } from "../types";

export function useMediaList(params?: QueryMediaParams) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: async () => {
      const res = await uploadService.getAllMedia(params);
      return res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 3,
  });
}
