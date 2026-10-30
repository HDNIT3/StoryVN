import React from "react";
import { StoryRevisionItem } from "@/features/stories";
import {
  REVISION_STATUS_CONFIG,
  formatRevisionDate,
} from "./revisionStatusConfig";

interface StoryRevisionListSidebarProps {
  items: StoryRevisionItem[];
  selectedRevisionId: string | null;
  onSelectRevisionId: (id: string) => void;
}

export function StoryRevisionListSidebar({
  items,
  selectedRevisionId,
  onSelectRevisionId,
}: StoryRevisionListSidebarProps) {
  return (
    <div className="lg:col-span-5 space-y-3">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
        Danh sách bản sửa ({items.length})
      </div>

      <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const config =
            REVISION_STATUS_CONFIG[item.status] || REVISION_STATUS_CONFIG.DRAFT;
          const isSelected = selectedRevisionId === item._id;

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
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-sky-600 truncate">
                    Bản #{items.length - index}
                  </span>
                  {item.isActive && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      Đang mở
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${config.className}`}
                >
                  {config.label}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-zinc-900 mt-1 line-clamp-1">
                {item.title || "(Chưa có tiêu đề)"}
              </h4>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                <span>
                  {item.isOfficial ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Bản chính thức
                    </span>
                  ) : item.ageRating ? (
                    `Độ tuổi ${item.ageRating}`
                  ) : (
                    ""
                  )}
                </span>
                <span>{formatRevisionDate(item.createdAt)}</span>
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
    </div>
  );
}
