import React from "react";
import { ChapterUpdateItem } from "@/features/chapters";

interface RevisionListSidebarProps {
  historyItems: ChapterUpdateItem[];
  totalItems: number;
  selectedRevisionId: string | null;
  onSelectRevisionId: (id: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function RevisionListSidebar({
  historyItems,
  totalItems,
  selectedRevisionId,
  onSelectRevisionId,
  page,
  totalPages,
  onPageChange,
}: RevisionListSidebarProps) {
  return (
    <div className="lg:col-span-5 space-y-3">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
        Danh sách bản sửa ({totalItems})
      </div>

      <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
        {historyItems.map((item) => {
          const isSelected = selectedRevisionId === item._id;
          const chapterObj = typeof item.chapterId === "object" ? (item.chapterId as any) : null;
          const storyObj = typeof item.storyId === "object" ? (item.storyId as any) : null;

          return (
            <button
              key={item._id}
              type="button"
              onClick={() => onSelectRevisionId(item._id)}
              className={`w-full text-left p-3.5 rounded-lg border transition cursor-pointer ${
                isSelected
                  ? "bg-white border-sky-500 shadow-xs ring-1 ring-sky-500"
                  : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-sky-600 truncate">
                  {storyObj?.title || "Tác phẩm"} • {chapterObj ? `Chương #${chapterObj.chapterNumber}` : "Chương"}
                </span>
                {item.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Đã duyệt
                  </span>
                )}
                {item.status === "PENDING_REVIEW" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chờ duyệt
                  </span>
                )}
                {item.status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Từ chối
                  </span>
                )}
                {item.status === "DRAFT" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Bản nháp
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-zinc-900 mt-1 line-clamp-1">
                {item.title}
              </h4>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                <span>{item.isFree ? "Miễn phí" : `${item.coinPrice} xu`}</span>
                <span>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>

              {item.rejectReason && item.status === "REJECTED" && (
                <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded p-1.5 line-clamp-1">
                  Lý do từ chối: {item.rejectReason}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-zinc-500">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
