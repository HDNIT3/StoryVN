"use client";

import React from "react";
import Link from "next/link";
import { StoryRevisionItem } from "@/features/stories";
import { useAllCategories } from "@/features/categories";
import { useTags } from "@/features/tags";
import {
  REVISION_STATUS_CONFIG,
  formatRevisionDate,
} from "./revisionStatusConfig";

interface StoryRevisionDetailViewerProps {
  selectedRevision: StoryRevisionItem | null;
  storySlug?: string;
  isMutating?: boolean;
  hasActiveRevision?: boolean;
  onRestore?: (revision: StoryRevisionItem) => void;
  onWithdraw?: (revision: StoryRevisionItem) => void;
}

export function StoryRevisionDetailViewer({
  selectedRevision,
  storySlug,
  isMutating = false,
  hasActiveRevision = false,
  onRestore,
  onWithdraw,
}: StoryRevisionDetailViewerProps) {
  const { data: categories = [] } = useAllCategories();
  const { data: tagsData } = useTags({ all: true });
  const tags = tagsData?.items || [];

  if (!selectedRevision) {
    return (
      <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center h-full">
        <span>Chọn một bản sửa đổi bên trái để xem chi tiết.</span>
      </div>
    );
  }

  const statusConfig =
    REVISION_STATUS_CONFIG[selectedRevision.status] ||
    REVISION_STATUS_CONFIG.DRAFT;

  const resolveNames = (refs: unknown, source: any[]) => {
    if (!Array.isArray(refs)) return [];
    return refs
      .map((ref: any) => {
        if (typeof ref === "object" && ref !== null) return ref.name;
        const matched = source.find((item: any) => item._id === ref);
        return matched?.name || "";
      })
      .filter(Boolean);
  };

  const genreNames = resolveNames(selectedRevision.genreIds, categories);
  const tagNames = resolveNames(selectedRevision.tagIds, tags);
  const editHref = storySlug ? `/tac-gia/tac-pham/chinh-sua/${storySlug}` : null;

  return (
    <div className="flex flex-col h-[750px]">
      {/* Header of Detail */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
              {selectedRevision.isOfficial && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Bản chính thức
                </span>
              )}
              {selectedRevision.isActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Đang mở
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight break-words">
              {selectedRevision.title || "(Chưa có tiêu đề)"}
            </h2>
          </div>

          {/* Hành động theo trạng thái bản sửa */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {selectedRevision.isActive &&
              selectedRevision.status === "PENDING_REVIEW" && (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onWithdraw?.(selectedRevision)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 rounded-md text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Rút bản chờ duyệt để sửa</span>
                </button>
              )}

            {selectedRevision.isActive && editHref && (
              <Link
                href={editHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold transition shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Tiếp tục chỉnh sửa bản này</span>
              </Link>
            )}

            {!selectedRevision.isActive && (
              <button
                type="button"
                disabled={
                  isMutating ||
                  hasActiveRevision ||
                  Boolean(selectedRevision.isOfficial)
                }
                onClick={() => onRestore?.(selectedRevision)}
                title={
                  hasActiveRevision
                    ? "Đang có bản sửa mở. Hãy rút hoặc hủy bản đó trước khi khôi phục bản khác."
                    : selectedRevision.isOfficial
                    ? "Đây là bản đang phát hành, không cần khôi phục."
                    : "Tạo bản nháp mới từ nội dung bản này"
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Khôi phục thành bản nháp</span>
              </button>
            )}

            {editHref && (
              <Link
                href={editHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200 rounded-md text-xs font-semibold transition"
              >
                <span>Mở trang sửa tác phẩm</span>
              </Link>
            )}
          </div>
        </div>

        {/* Metadata Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-zinc-200 text-xs">
          <div>
            <span className="text-zinc-400 block text-[11px]">Trạng thái:</span>
            <span className="font-semibold text-zinc-800">
              {statusConfig.label}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[11px]">Độ tuổi:</span>
            <span className="font-semibold text-zinc-800">
              {selectedRevision.ageRating || "—"}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[11px]">Ngày tạo:</span>
            <span className="font-semibold text-zinc-800">
              {formatRevisionDate(selectedRevision.createdAt)}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[11px]">Cập nhật:</span>
            <span className="font-semibold text-zinc-800">
              {formatRevisionDate(selectedRevision.updatedAt)}
            </span>
          </div>
        </div>

        {/* Rejection Note */}
        {selectedRevision.status === "REJECTED" &&
          selectedRevision.rejectReason && (
            <div className="mt-3 bg-rose-50 border border-rose-200 rounded-md p-2.5 text-xs text-rose-800">
              <strong>Lý do từ chối:</strong> {selectedRevision.rejectReason}
            </div>
          )}
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {selectedRevision.coverUrl && (
            <img
              src={selectedRevision.coverUrl}
              alt={selectedRevision.title || "Ảnh bìa"}
              className="w-full sm:w-32 h-44 object-cover rounded-md border border-zinc-200 shrink-0"
            />
          )}
          <div className="min-w-0 space-y-2">
            {genreNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genreNames.map((name) => (
                  <span
                    key={`genre-${name}`}
                    className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            {tagNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tagNames.map((name) => (
                  <span
                    key={`tag-${name}`}
                    className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-medium"
                  >
                    #{name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Mô tả
          </p>
          <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
            {selectedRevision.description || "(Không có mô tả)"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Ghi chú tác giả
          </p>
          <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
            {selectedRevision.authorNote || "(Không có ghi chú)"}
          </p>
        </div>
      </div>
    </div>
  );
}
