import React from "react";
import type { MediaItem } from "@/features/upload";

interface MediaGridProps {
  items: MediaItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  limit: number;
  onRetry: () => void;
  onPreview: (item: MediaItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  isLoading,
  isError,
  errorMessage,
  limit,
  onRetry,
  onPreview,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-2.5">
        {Array.from({ length: limit }).map((_, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-lg bg-zinc-100 animate-pulse border border-zinc-200/60"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <p className="text-xs text-red-600 font-medium">
          {errorMessage || "Không thể tải danh sách hình ảnh"}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-xs font-semibold transition cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-zinc-900">Chưa có hình ảnh nào</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Không tìm thấy file ảnh nào trong hệ thống hoặc theo bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onPreview(item)}
          className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 relative group cursor-pointer border border-zinc-200/80 hover:border-sky-500 hover:shadow-md transition-all duration-150 select-none"
        >
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 bg-zinc-100"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== item.url) {
                target.src = item.url;
              }
            }}
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-between p-1.5 pointer-events-none">
            <span
              className={`self-end text-[9px] font-semibold px-1 py-0.5 rounded text-white ${
                item.source === "cloud" ? "bg-sky-600/90" : "bg-emerald-600/90"
              }`}
            >
              {item.source === "cloud" ? "Cloud" : "Local"}
            </span>

            <p className="text-[10px] text-white truncate drop-shadow-xs font-medium">
              {item.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
