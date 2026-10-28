"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { StarRatingInput } from "./StarRatingInput";
import { useMyRating, useRateStory, useDeleteMyRating } from "../queries/useRatingQueries";

interface UserRatingBoxProps {
  storyId: string;
  authorId?: string | null;
}

export const UserRatingBox: React.FC<UserRatingBoxProps> = ({
  storyId,
  authorId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { data: myRatingRes, isLoading: isLoadingMyRating } = useMyRating(
    storyId,
    isAuthenticated
  );

  const existingRating = myRatingRes?.data;
  const isAuthor = user && authorId && user._id === authorId;

  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReview(existingRating.review || "");
    }
  }, [existingRating]);

  const { mutate: rateStory, isPending: isSubmitting } = useRateStory(storyId);
  const { mutate: deleteRating, isPending: isDeleting } = useDeleteMyRating(storyId);

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">
            Bạn đã đọc tác phẩm này?
          </h4>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            Đăng nhập để chia sẻ cảm nhận và chấm điểm cho truyện nhé.
          </p>
        </div>
        <Link
          href="/dang-nhap"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (isAuthor) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs flex items-center gap-2">
        <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Bạn là tác giả của tác phẩm này nên không thể tự đánh giá truyện của chính mình.</span>
      </div>
    );
  }

  if (isLoadingMyRating) {
    return (
      <div className="p-5 rounded-2xl bg-zinc-50 animate-pulse border border-zinc-200 text-xs text-zinc-400 text-center">
        Đang tải đánh giá của bạn...
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rateStory(
      { rating, review },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa đánh giá của mình không?")) {
      deleteRating(undefined, {
        onSuccess: () => {
          setRating(5);
          setReview("");
          setIsEditing(false);
        },
      });
    }
  };

  // Nếu người dùng đã đánh giá và không ở chế độ chỉnh sửa -> hiển thị card tóm tắt đánh giá của họ
  if (existingRating && !isEditing) {
    return (
      <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Đánh giá của bạn
            </span>
            <div className="flex text-amber-400 text-sm">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}>{s <= existingRating.rating ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-900">
              ({existingRating.rating}/5)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Chỉnh sửa
            </button>
            <span className="text-zinc-300">|</span>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>

        {existingRating.review ? (
          <p className="text-sm text-zinc-700 whitespace-pre-line">
            {existingRating.review}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 italic">
            (Bạn chưa để lại nhận xét bằng chữ)
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-sm font-bold text-zinc-900">
            {existingRating ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá tác phẩm này"}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Chọn số sao và để lại nhận xét cảm nhận của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StarRatingInput value={rating} onChange={setRating} size="md" />
          <span className="text-sm font-black text-amber-600 min-w-8">
            {rating}/5
          </span>
        </div>
      </div>

      <div>
        <textarea
          rows={3}
          maxLength={2000}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Chia sẻ nhận xét của bạn về cốt truyện, nhân vật, văn phong... (Tùy chọn)"
          className="w-full p-3 rounded-xl border border-zinc-200 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all resize-none"
        />
        <div className="text-right text-[11px] text-zinc-400 mt-1">
          {review.length}/2000 ký tự
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5">
        {existingRating && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          {isSubmitting
            ? "Đang lưu..."
            : existingRating
            ? "Cập nhật đánh giá"
            : "Gửi đánh giá"}
        </button>
      </div>
    </form>
  );
};
