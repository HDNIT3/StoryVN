import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { adminRatingService } from "../services/admin-rating.service";
import { adminKeys } from "./admin.keys";
import type {
  AdminRatingStatus,
  QueryAdminRatingsParams,
} from "../types/rating.types";

export function useAdminRatings(params?: QueryAdminRatingsParams) {
  return useQuery({
    queryKey: adminKeys.ratings(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await adminRatingService.getRatings(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminRatingCounts() {
  return useQuery({
    queryKey: adminKeys.ratingCounts,
    queryFn: async () => {
      const res = await adminRatingService.getCounts();
      return res.data;
    },
  });
}

export function useUpdateRatingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ratingId,
      status,
    }: {
      ratingId: string;
      status: AdminRatingStatus;
    }) => adminRatingService.updateStatus(ratingId, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái đánh giá thành công");
      queryClient.invalidateQueries({ queryKey: ["admin", "ratings"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Cập nhật trạng thái đánh giá thất bại");
    },
  });
}

export function useDeleteRatingPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ratingId: string) =>
      adminRatingService.deletePermanent(ratingId),
    onSuccess: () => {
      toast.success("Xóa vĩnh viễn đánh giá thành công");
      queryClient.invalidateQueries({ queryKey: ["admin", "ratings"] });
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Xóa đánh giá thất bại");
    },
  });
}

