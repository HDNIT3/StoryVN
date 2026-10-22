import React from "react";
import Link from "next/link";
import type { PublicChapterItem } from "@/features/chapters";

interface StoryChapterListProps {
  chapters: PublicChapterItem[];
  publicChapterCount: number;
  chapterOrder: "asc" | "desc";
  onToggleOrder: () => void;
  isLoading: boolean;
  isError: boolean;
  slugParam: string;
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

export const StoryChapterList: React.FC<StoryChapterListProps> = ({
  chapters,
  publicChapterCount,
  chapterOrder,
  onToggleOrder,
  isLoading,
  isError,
  slugParam,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Mục Lục */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-zinc-100">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-amber-700 uppercase block mb-1">
            MỤC LỤC
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
            Danh sách chương
          </h3>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-sm font-semibold text-zinc-500">
            {publicChapterCount} chương
          </span>

          {/* Nút đảo thứ tự */}
          <button
            type="button"
            onClick={onToggleOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-xl transition-colors cursor-pointer"
            title="Đảo chiều sắp xếp danh sách chương"
          >
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{chapterOrder === "asc" ? "Chương cũ" : "Chương mới"}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 text-center text-zinc-500 text-sm">
          <div className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin mx-auto mb-2" />
          Đang tải danh sách chương...
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-8 text-center text-rose-600 text-sm">
          Không thể tải danh sách chương. Vui lòng thử lại sau.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && chapters.length === 0 && (
        <div className="py-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-zinc-900 mb-1">Chưa có chương nào được xuất bản</h4>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Tác phẩm đang trong quá trình sáng tác và cập nhật nội dung. Hãy bấm &quot;Theo dõi&quot; để nhận thông báo sớm nhất!
          </p>
        </div>
      )}

      {/* Chapter list */}
      {!isLoading && !isError && chapters.length > 0 && (
        <div className="border border-zinc-200/90 rounded-2xl overflow-hidden divide-y divide-zinc-200/80 bg-white shadow-2xs">
          {chapters.map((chapter) => (
            <Link
              key={chapter._id}
              href={`/truyen/${slugParam}/chuong/${chapter.chapterNumber}`}
              className="group flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 hover:bg-zinc-50/80 transition-colors"
            >
              <span className="min-w-0 flex-1 flex items-baseline gap-2">
                <span className="shrink-0 text-base font-bold text-zinc-900 tabular-nums group-hover:text-emerald-700 transition-colors">
                  Chương {chapter.chapterNumber}
                </span>
                {chapter.title && (
                  <span className="min-w-0 truncate text-base text-zinc-500 group-hover:text-emerald-700 transition-colors">
                    {chapter.title}
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3.5 sm:gap-6 shrink-0">
                <span
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-400 group-hover:text-emerald-700 transition-colors"
                  title={`${(chapter.viewCount || 0).toLocaleString("vi-VN")} lượt đọc`}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-zinc-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="tabular-nums">
                    {formatNumber(chapter.viewCount || 0)}
                  </span>
                </span>

                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 group-hover:text-emerald-700 transition-colors"
                  title={`${(chapter.wordCount || 0).toLocaleString("vi-VN")} từ`}
                >
                  <svg className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M4 18h13" />
                  </svg>
                  <span className="tabular-nums">
                    {formatNumber(chapter.wordCount || 0)}
                  </span>
                </span>

                <span className="text-xs sm:text-sm font-medium text-zinc-500 tabular-nums">
                  {formatDate(chapter.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
