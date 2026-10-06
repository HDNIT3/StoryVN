"use client";

import { StoryItem, StoryAgeRating } from "@/types/story";

interface StoryCardItemProps {
  story: StoryItem;
  onEdit: (story: StoryItem) => void;
  onSubmitReview?: (story: StoryItem) => void;
  onAppeal?: (story: StoryItem) => void;
  isSubmittingReview?: boolean;
}

export function StoryCardItem({
  story,
  onEdit,
  onSubmitReview,
  onAppeal,
  isSubmittingReview = false,
}: StoryCardItemProps) {
  const storyId = story._id || story.id;

  const statusBadgeConfig: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    PUBLISHED: {
      label: "Đã xuất bản",
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    PENDING_REVIEW: {
      label: "Chờ duyệt",
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    DRAFT: {
      label: "Bản nháp",
      bg: "bg-zinc-100 border-zinc-200",
      text: "text-zinc-700",
      dot: "bg-zinc-400",
    },
    REJECTED: {
      label: "Bị từ chối",
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
  };



  const statusConfig = statusBadgeConfig[story.status] || statusBadgeConfig.DRAFT;

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("vi-VN");
  };

  const formattedDate = story.updatedAt
    ? new Date(story.updatedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const genreNames = (story.genreIds || [])
    .map((g: any) => (typeof g === "object" && g !== null ? g.name : g))
    .filter(Boolean);

  const tagNames = (story.tagIds || [])
    .map((t: any) => (typeof t === "object" && t !== null ? t.name : t))
    .filter(Boolean);

  const displayGenres = genreNames.length > 0 ? genreNames : story.genres || [];
  const displayTags = tagNames.length > 0 ? tagNames : story.tags || [];

  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs hover:border-zinc-300 transition-colors p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5">
      {/* Cover Image (Chuẩn tỉ lệ 2:3) */}
      <div className="w-28 sm:w-32 aspect-[2/3] shrink-0 rounded-md overflow-hidden relative border border-zinc-200/80 bg-zinc-100 flex items-center justify-center shadow-2xs mx-auto sm:mx-0">
        {story.coverUrl ? (
          <img
            src={story.coverUrl}
            alt={story.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-b from-sky-700 to-indigo-900 p-3 flex flex-col justify-between text-white select-none">
            <span className="text-[10px] font-semibold uppercase bg-white/20 self-start px-1.5 py-0.5 rounded">
              {displayGenres[0] || "Truyện"}
            </span>
            <p className="text-xs font-bold line-clamp-3 text-center my-auto leading-tight drop-shadow-xs">
              {story.title}
            </p>
            <span className="text-[10px] text-white/70 text-center border-t border-white/20 pt-1">
              Chưa có bìa
            </span>
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Top Status & Meta Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {story.status !== "DRAFT" && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.bg} ${statusConfig.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            )}

            {story.ageRating && story.ageRating !== "ALL" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {story.ageRating}
              </span>
            )}

            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                story.visibility === "PUBLIC"
                  ? "bg-sky-50 border-sky-200 text-sky-700"
                  : "bg-zinc-100 border-zinc-200 text-zinc-600"
              }`}
            >
              {story.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}
            </span>

            {formattedDate && (
              <span className="text-xs text-zinc-400 ml-auto hidden sm:inline">
                Cập nhật: {formattedDate}
              </span>
            )}
          </div>

          {/* Title & Slug */}
          <h3
            onClick={() => onEdit(story)}
            className="text-base sm:text-lg font-bold text-zinc-900 hover:text-sky-600 cursor-pointer transition-colors line-clamp-1"
          >
            {story.title}
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
            /truyen/{story.slug}
          </p>

          {/* Description */}
          {story.description ? (
            <p className="text-xs sm:text-sm text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
              {story.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 italic mt-2">Chưa có phần tóm tắt nội dung.</p>
          )}

          {/* Rejection notice if REJECTED */}
          {story.status === "REJECTED" && (
            <div className="mt-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <span className="font-bold text-rose-900">Lý do từ chối:</span>{" "}
                  {story.rejectReason || "Chưa đạt tiêu chuẩn xuất bản."}
                </div>
              </div>

              {story.authorFeedback && (
                <div className="text-[11px] bg-white/80 p-2 rounded border border-rose-100 text-zinc-700">
                  <span className="font-semibold text-indigo-700">Giải trình bạn đã gửi:</span>{" "}
                  "{story.authorFeedback}"
                </div>
              )}

              {onAppeal && (
                <div className="pt-1 flex items-center justify-between border-t border-rose-100/80">
                  <span className="text-[11px] text-rose-600">
                    Lý do từ chối chưa thỏa đáng?
                  </span>
                  <button
                    type="button"
                    onClick={() => onAppeal(story)}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  >
                    💬 Gửi phản hồi / Khiếu nại
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Genres & Tags */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {displayGenres.map((g, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100"
              >
                {g}
              </span>
            ))}
            {displayTags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Row: Stats & Actions */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              <strong className="text-zinc-800 font-semibold">{story.stats?.chapterCount || 0}</strong> chương
            </span>
            <span>•</span>
            <span>
              <strong className="text-zinc-800 font-semibold">{formatNumber(story.stats?.viewCount)}</strong> lượt đọc
            </span>
            {story.stats?.wordCount ? (
              <>
                <span>•</span>
                <span>
                  <strong className="text-zinc-800 font-semibold">{formatNumber(story.stats.wordCount)}</strong> chữ
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {story.status === "REJECTED" && onAppeal && (
              <button
                type="button"
                onClick={() => onAppeal(story)}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
              >
                💬 Khiếu nại
              </button>
            )}

            {(story.status === "DRAFT" || story.status === "REJECTED") && onSubmitReview && (
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => onSubmitReview(story)}
                className="px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Gửi xét duyệt
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(story)}
              className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
