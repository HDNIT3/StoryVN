"use client";

import React, { useState } from "react";
import { useStoryRatings, useRatingSummary } from "../queries/useRatingQueries";
import { RatingSummaryWidget } from "./RatingSummaryWidget";
import { UserRatingBox } from "./UserRatingBox";
import { RatingItemCard } from "./RatingItemCard";
import type { QueryRatingsParams } from "../types";

interface StoryRatingsSectionProps {
  storyId: string;
  authorId?: string | null;
}

export const StoryRatingsSection: React.FC<StoryRatingsSectionProps> = ({
  storyId,
  authorId,
}) => {
  const [selectedStar, setSelectedStar] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<QueryRatingsParams["sort"]>("NEWEST");

  const { data: summaryRes } = useRatingSummary(storyId);
  const summary = summaryRes?.data;

  const { data: ratingsRes, isLoading, isError } = useStoryRatings(storyId, {
    page,
    limit: 10,
    rating: selectedStar,
    sort,
  });

  const ratingsData = ratingsRes?.data;
  const items = ratingsData?.items || [];
  const pagination = ratingsData?.pagination;

  const handleSelectStar = (star?: number) => {
    setSelectedStar(star);
    setPage(1);
  };

  const handleSortChange = (newSort: QueryRatingsParams["sort"]) => {
    setSort(newSort);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Box tổng hợp điểm & phân bổ sao */}
      <RatingSummaryWidget
        summary={summary}
        selectedStar={selectedStar}
        onSelectStar={handleSelectStar}
      />

      {/* Box người dùng hiện tại đánh giá */}
      <UserRatingBox storyId={storyId} authorId={authorId} />

      {/* Header danh sách & Sắp xếp */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <h3 className="text-base font-bold text-zinc-900">
          Nhận xét từ độc giả {pagination?.totalItems ? `(${pagination.totalItems})` : ""}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-medium">Sắp xếp:</span>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 font-semibold focus:outline-hidden focus:border-emerald-600"
          >
            <option value="NEWEST">Mới nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="RATING_DESC">Điểm cao nhất</option>
            <option value="RATING_ASC">Điểm thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 animate-pulse h-28"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-sm text-zinc-500">
          Không thể tải danh sách đánh giá vào lúc này.
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 rounded-2xl bg-zinc-50/60 border border-zinc-200/80 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
            ★
          </div>
          <p className="text-sm font-semibold text-zinc-800">
            {selectedStar
              ? `Chưa có đánh giá ${selectedStar} sao nào`
              : "Tác phẩm chưa có nhận xét nào"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Hãy là người đầu tiên chia sẻ cảm nhận về truyện này!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <RatingItemCard key={item._id} rating={item} />
          ))}
        </div>
      )}

      {/* Phân trang */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Trang trước
          </button>
          <span className="text-xs text-zinc-500 font-medium px-2">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};
