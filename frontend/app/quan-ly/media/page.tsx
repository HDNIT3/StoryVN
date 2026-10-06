"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useMediaList } from "@/lib/hooks/queries/useMediaQuery";
import type { MediaItem } from "@/types/upload";
import { toast } from "@/lib/toast";

export default function QuanLyMediaPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/quan-ly/duyet-tac-gia");
    }
  }, [user, router]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(40);
  const [sourceFilter, setSourceFilter] = useState<"all" | "cloud" | "local">("all");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const { data, isLoading, isError, error, refetch, isFetching } = useMediaList(
    isAdmin
      ? {
          page,
          limit,
          source: sourceFilter,
        }
      : undefined
  );

  if (user && user.role !== "ADMIN") {
    return null;
  }

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
  };

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
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

        {/* Source Filter Tabs & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 bg-zinc-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => handleSourceChange("all")}
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
              onClick={() => handleSourceChange("cloud")}
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
              onClick={() => handleSourceChange("local")}
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
            onClick={() => refetch()}
            title="Làm mới"
            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition cursor-pointer border border-zinc-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-2.5">
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-lg bg-zinc-100 animate-pulse border border-zinc-200/60"
            />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
          <p className="text-xs text-red-600 font-medium">
            {(error as any)?.message || "Không thể tải danh sách hình ảnh"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-xs font-semibold transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : items.length > 0 ? (
        /* Image Grid (10 columns on large screens) */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setPreviewItem(item)}
              className="aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 relative group cursor-pointer border border-zinc-200/80 hover:border-sky-500 hover:shadow-md transition-all duration-150 select-none"
            >
              {/* Thumbnail image with lazy loading & async decoding */}
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 bg-zinc-100"
                onError={(e) => {
                  // Fallback to original url if transformed thumbnail fails
                  const target = e.currentTarget;
                  if (target.src !== item.url) {
                    target.src = item.url;
                  }
                }}
              />

              {/* Source tag on hover */}
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
      ) : (
        /* Empty State */
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
      )}

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
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="min-w-0 pr-3">
                <h3 className="text-sm font-bold text-zinc-900 truncate">
                  {previewItem.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                  <span
                    className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                      previewItem.source === "cloud"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {previewItem.source === "cloud" ? "Cloudinary" : "Local Storage"}
                  </span>
                  {previewItem.format && (
                    <span className="uppercase font-mono">{previewItem.format}</span>
                  )}
                  {previewItem.size ? (
                    <span>• {formatFileSize(previewItem.size)}</span>
                  ) : null}
                  {previewItem.width && previewItem.height ? (
                    <span>• {previewItem.width}×{previewItem.height}px</span>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-7 h-7 rounded hover:bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="flex-1 overflow-auto p-4 bg-zinc-950 flex items-center justify-center min-h-[300px] max-h-[60vh]">
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="max-w-full max-h-[55vh] object-contain rounded shadow-lg"
              />
            </div>

            {/* Modal Footer & Copy URL */}
            <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
              <input
                type="text"
                readOnly
                value={previewItem.url}
                className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded text-xs text-zinc-600 font-mono select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem.url)}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold transition cursor-pointer shadow-2xs shrink-0"
              >
                Sao chép link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
