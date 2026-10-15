"use client";

import React, { useState } from "react";
import type { AdminChapterItem, ChapterStatus } from "@/types/chapter";

interface Props {
  chapters: AdminChapterItem[];
  isLoading: boolean;
  onViewDetail: (chapter: AdminChapterItem) => void;
  onApprove: (chapter: AdminChapterItem) => void;
  onReject: (chapter: AdminChapterItem) => void;
  onUnpublish: (chapter: AdminChapterItem) => void;
}

function StoryThumb({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300 p-1 text-center select-none">
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins} phút trước`;
    }
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: ChapterStatus }) {
  const badges: Record<ChapterStatus, { label: string; className: string }> = {
    DRAFT: {
      label: "Bản nháp",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    PENDING_REVIEW: {
      label: "Chờ duyệt",
      className: "bg-amber-50 text-amber-700 border-amber-300/80 animate-pulse",
    },
    PUBLISHED: {
      label: "Đã xuất bản",
      className: "bg-emerald-50 text-emerald-700 border-emerald-300/80",
    },
    REJECTED: {
      label: "Từ chối",
      className: "bg-rose-50 text-rose-700 border-rose-300/80",
    },
    HIDDEN: {
      label: "Đã ẩn",
      className: "bg-purple-50 text-purple-700 border-purple-300/80",
    },
  };

  const current = badges[status] || badges.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export function ChapterTable({
  chapters,
  isLoading,
  onViewDetail,
  onApprove,
  onReject,
  onUnpublish,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-10 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Đang tải danh sách chương...</p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy chương nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Không có chương truyện nào khớp với bộ lọc tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Chương / Tác phẩm</th>
              <th className="py-3 px-4">Tác giả</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Phí đọc</th>
              <th className="py-3 px-4 text-center">Lượt đọc</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {chapters.map((ch) => {
              const story = typeof ch.storyId === "object" ? ch.storyId : null;
              const author = story && typeof story.authorId === "object" ? story.authorId : null;
              const authorName =
                author?.displayName || author?.username || "Chưa xác định";
              const isPending = ch.status === "PENDING_REVIEW";
              const isPublished = ch.status === "PUBLISHED";

              const timeStr = formatDate(ch.createdAt);

              return (
                <tr
                  key={ch._id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Cột Chương & Truyện */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Bìa truyện mini */}
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs relative">
                        <StoryThumb src={story?.coverUrl} alt={story?.title || "Bìa"} />
                      </div>

                      <div className="min-w-0 max-w-xs md:max-w-md">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md text-xs">
                            Chương {ch.chapterNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => onViewDetail(ch)}
                            className="font-bold text-slate-900 hover:text-sky-600 transition-colors truncate text-left text-xs cursor-pointer"
                            title={ch.title || `Chương ${ch.chapterNumber}`}
                          >
                            {ch.title || "(Không có tiêu đề)"}
                          </button>
                        </div>

                        {story && (
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span>Truyện:</span>
                            <span className="font-semibold text-slate-700">{story.title}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột Tác giả */}
                  <td className="py-3.5 px-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate">
                        {authorName}
                      </p>
                      {author?.email && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {author.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={ch.status} />
                  </td>

                  {/* Cột Phí đọc / Coin */}
                  <td className="py-3.5 px-4 text-center">
                    {ch.isFree ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[11px]">
                        <span>💰</span>
                        <span>{ch.coinPrice} Xu</span>
                      </span>
                    )}
                  </td>

                  {/* Cột Lượt đọc */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-medium text-slate-700 text-xs">
                      {(ch.viewCount ?? 0).toLocaleString("vi-VN")}
                    </span>
                  </td>

                  {/* Cột Thời gian */}
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {timeStr}
                  </td>

                  {/* Cột Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(ch)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem nội dung chi tiết chương"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Duyệt & Từ chối nếu PENDING */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(ch)}
                            className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            title="Phê duyệt xuất bản chương"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(ch)}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-500 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Từ chối chương kèm lý do"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Gỡ duyệt nếu PUBLISHED */}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => onUnpublish(ch)}
                          className="p-1.5 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
                          title="Gỡ duyệt chương (chuyển về bản nháp)"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
