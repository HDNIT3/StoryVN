import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { StoryDetailData, StoryProgressState, StoryAgeRating } from "@/features/stories";

interface StoryDetailHeaderProps {
  story: StoryDetailData;
  slugParam: string;
  publicChapterCount: number;
  firstChapter?: { chapterNumber: number };
  onShare: () => void;
  onPlaceholder: (name: string) => void;
}

function ProgressBadge({ state }: { state?: StoryProgressState }) {
  switch (state) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Hoàn thành
        </span>
      );
    case "ON_HOLD":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Tạm ngưng
        </span>
      );
    case "ONGOING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Đang ra
        </span>
      );
  }
}

function AgeRatingBadge({ rating }: { rating?: StoryAgeRating }) {
  switch (rating) {
    case "18+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          18+
        </span>
      );
    case "16+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          16+
        </span>
      );
    case "13+":
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          13+
        </span>
      );
    case "ALL":
    default:
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
          Mọi lứa tuổi
        </span>
      );
  }
}

function AuthorLink({ author }: { author?: StoryDetailData["author"] }) {
  const avatar = author?.avatar || null;
  const name =
    author?.penName ||
    author?.displayName ||
    author?.name ||
    author?.username ||
    "Tác giả StoryVN";

  const content = (
    <>
      {avatar && (
        <span className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-zinc-200">
          <Image src={avatar} alt={name} fill unoptimized sizes="24px" className="object-cover" />
        </span>
      )}
      <span>{name}</span>
    </>
  );

  if (author?.username) {
    return (
      <Link
        href={`/tac-gia/${author.username}`}
        className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-900 hover:underline transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-800">
      {content}
    </span>
  );
}

function formatNumber(num?: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString("vi-VN");
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Chưa cập nhật";
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "Vừa xong";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  } catch {
    return dateStr;
  }
}

export const StoryDetailHeader: React.FC<StoryDetailHeaderProps> = ({
  story,
  slugParam,
  publicChapterCount,
  firstChapter,
  onShare,
  onPlaceholder,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        {/* Ảnh bìa */}
        <div className="w-full sm:w-56 shrink-0 flex flex-col items-center">
          <div className="relative w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200/80 shadow-md">
            {story.coverUrl ? (
              <Image
                src={story.coverUrl}
                alt={story.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 176px, 224px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                <svg className="w-12 h-12 mb-2 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs">Chưa có ảnh bìa</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <ProgressBadge state={story.progressState} />
            <AgeRatingBadge rating={story.ageRating} />
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
            {story.title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
            <span className="text-zinc-500">Tác giả:</span>
            <AuthorLink author={story.author} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {story.genres && story.genres.length > 0 ? (
              story.genres.map((genre) => (
                <Link
                  key={genre._id || genre.slug}
                  href={`/truyen?genre=${genre.slug}`}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                >
                  {genre.name}
                </Link>
              ))
            ) : (
              <span className="text-xs text-zinc-400 italic">Chưa phân loại</span>
            )}
          </div>

          {/* Thống kê */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-zinc-50/80 border border-zinc-200/60">
            <div className="text-center">
              <div className="text-xs text-zinc-500 font-medium">Lượt đọc</div>
              <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                {formatNumber(story.stats?.viewCount)}
              </div>
            </div>
            <div className="text-center border-l border-zinc-200/60">
              <div className="text-xs text-zinc-500 font-medium">Theo dõi</div>
              <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                {formatNumber(story.stats?.followCount)}
              </div>
            </div>
            <div className="text-center border-l border-zinc-200/60">
              <div className="text-xs text-zinc-500 font-medium">Đánh giá</div>
              <div className="text-base sm:text-lg font-bold text-amber-600 mt-0.5 flex items-center justify-center gap-1">
                <span>★</span>
                <span>{story.stats?.ratingAverage ? story.stats.ratingAverage.toFixed(1) : "5.0"}</span>
              </div>
            </div>
            <div className="text-center border-l border-zinc-200/60">
              <div className="text-xs text-zinc-500 font-medium">Số chương</div>
              <div className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5">
                {publicChapterCount}
              </div>
            </div>
            <div className="text-center border-l border-zinc-200/60">
              <div className="text-xs text-zinc-500 font-medium">Số từ</div>
              <div
                className="text-base sm:text-lg font-bold text-zinc-900 mt-0.5"
                title={`${(story.stats?.wordCount || 0).toLocaleString("vi-VN")} từ`}
              >
                {formatNumber(story.stats?.wordCount)}
              </div>
            </div>
          </div>

          {/* Meta ngày tháng */}
          <div className="mt-5 text-xs text-zinc-500 space-y-1.5 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="w-24 text-zinc-400">Ngày đăng:</span>
              <span className="text-zinc-700 font-medium">{formatDate(story.publishedAt || story.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-24 text-zinc-400">Cập nhật:</span>
              <span className="text-zinc-700 font-medium">{formatRelativeTime(story.updatedAt)}</span>
            </div>
          </div>

          {/* Nút thao tác */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {firstChapter ? (
              <Link
                href={`/truyen/${slugParam}/chuong/${firstChapter.chapterNumber}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Đọc từ đầu
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Truyện chưa có chương nào được xuất bản"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-400 border border-zinc-200/80 cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Đọc từ đầu
              </button>
            )}

            <button
              type="button"
              onClick={() => onPlaceholder("Theo dõi truyện")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/80 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Theo dõi
            </button>

            <button
              type="button"
              onClick={onShare}
              title="Chia sẻ truyện đến bạn bè, Zalo, Facebook, Telegram..."
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-200/80 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
