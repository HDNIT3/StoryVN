import React from "react";

interface MediaFilterBarProps {
  total: number;
  isFetching: boolean;
  sourceFilter: "all" | "cloud" | "local";
  onSourceChange: (src: "all" | "cloud" | "local") => void;
  onRefresh: () => void;
}

export const MediaFilterBar: React.FC<MediaFilterBarProps> = ({
  total,
  isFetching,
  sourceFilter,
  onSourceChange,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Thư viện ảnh {total > 0 && <span className="text-zinc-500 font-normal">({total})</span>}
          </h1>
          {isFetching && (
            <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          Tổng hợp hình ảnh hiện có trong dự án (Cloudinary & Local Storage)
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="inline-flex p-1 bg-zinc-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => onSourceChange("all")}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              sourceFilter === "all"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("cloud")}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              sourceFilter === "cloud"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>Cloudinary</span>
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("local")}
            className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
              sourceFilter === "local"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>Local</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Làm mới"
          className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition cursor-pointer border border-zinc-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};
