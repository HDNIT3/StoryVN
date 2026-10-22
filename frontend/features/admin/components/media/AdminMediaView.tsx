"use client";

import React, { useState } from "react";
import { useMediaList, type MediaItem } from "@/features/upload";
import { toast } from "@/lib/toast";
import { MediaFilterBar } from "./MediaFilterBar";
import { MediaGrid } from "./MediaGrid";
import { MediaPreviewModal } from "./MediaPreviewModal";

export const AdminMediaView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(40);
  const [sourceFilter, setSourceFilter] = useState<"all" | "cloud" | "local">("all");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useMediaList({
    page,
    limit,
    source: sourceFilter,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSourceChange = (src: "all" | "cloud" | "local") => {
    setSourceFilter(src);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép đường dẫn hình ảnh!");
  };

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <MediaFilterBar
        total={total}
        isFetching={isFetching}
        sourceFilter={sourceFilter}
        onSourceChange={handleSourceChange}
        onRefresh={() => refetch()}
      />

      {/* Main Grid Content */}
      <MediaGrid
        items={items}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        limit={limit}
        onRetry={() => refetch()}
        onPreview={setPreviewItem}
      />

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            <span>
              Trang <strong className="text-zinc-900">{page}</strong> / {totalPages} (Tổng{" "}
              <strong className="text-zinc-900">{total}</strong> ảnh)
            </span>

            {/* Per-page selector */}
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span>Hiển thị:</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-xs text-zinc-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              >
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={80}>80</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="px-2 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              « Đầu
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              ‹ Trước
            </button>

            {/* Page number chips */}
            {Array.from({ length: totalPages })
              .map((_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-zinc-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-7 h-7 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                        page === p
                          ? "bg-sky-600 text-white shadow-2xs"
                          : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Sau ›
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Cuối »
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <MediaPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onCopyUrl={handleCopyUrl}
      />
    </div>
  );
};
