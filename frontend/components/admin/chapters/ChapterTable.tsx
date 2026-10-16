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
  onHide?: (chapter: AdminChapterItem) => void;
  onUnhide?: (chapter: AdminChapterItem) => void;
  onResetPending?: (chapter: AdminChapterItem) => void;
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
  onHide,
  onUnhide,
  onResetPending,
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
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Chương / Tác phẩm</th>
              <th className="py-3 px-4">Tác giả</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Phí đọc</th>
              <th className="py-3 px-4 text-center">Lượt đọc</th>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {chapters.map((ch) => {
              const story = typeof ch.storyId === "object" ? ch.storyId : null;
              const author = story && typeof story.authorId === "object" ? story.authorId : null;
              const authorName =
                author?.displayName || author?.username || "Chưa xác định";
              const authorEmail = author?.email || "";
              const authorAvatar = author?.avatarUrl;
              const isPendingUpdateReview = Boolean(
                ch.isPendingUpdateReview ||
                (ch.status === "PUBLISHED" && ch.pendingUpdate?.status === "PENDING_REVIEW")
              );
              const isPending = ch.status === "PENDING_REVIEW" || isPendingUpdateReview;
              const isPublished = ch.status === "PUBLISHED" && !isPendingUpdateReview;

              const timeStr = formatDate(ch.createdAt);

              return (
                <tr
                  key={ch._id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* Cột Chương & Truyện */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Bìa truyện mini bo tròn */}
                      <div className="w-10 h-13 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-2xs relative">
                        <StoryThumb src={story?.coverUrl} alt={story?.title || "Bìa"} />
                      </div>

                      <div className="min-w-0 max-w-xs md:max-w-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md text-[11px]">
                            Chương {ch.chapterNumber}
                          </span>
                          {isPendingUpdateReview && (
                            <span className="font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md text-[10px]">
                              Bản sửa
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewDetail(ch)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors truncate text-left text-xs cursor-pointer"
                            title={ch.title || `Chương ${ch.chapterNumber}`}
                          >
                            {ch.title || "(Không có tiêu đề)"}
                          </button>
                        </div>

                        {story && (
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            Truyện: <span className="font-semibold text-slate-700">{story.title}</span>
                          </p>
                        )}

                        {/* Hiển thị lý do phù hợp theo trạng thái */}
                        {ch.rejectReason && (
                          <div className={`mt-1.5 flex items-start gap-1 text-[11px] px-2 py-1 rounded-lg border ${
                            ch.status === "HIDDEN"
                              ? "text-purple-700 bg-purple-50 border-purple-200/80"
                              : ch.status === "DRAFT"
                              ? "text-amber-800 bg-amber-50 border-amber-200/80"
                              : "text-rose-700 bg-rose-50 border-rose-200/80"
                          }`}>
                            <span className="font-bold shrink-0">
                              {ch.status === "HIDDEN"
                                ? "Lý do tạm ẩn:"
                                : ch.status === "DRAFT"
                                ? "Lý do gỡ duyệt:"
                                : "Lý do từ chối:"}
                            </span>
                            <span className="line-clamp-2">{ch.rejectReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột Tác giả với Avatar tròn giống ảnh */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden ring-1 ring-slate-200">
                        {authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          authorName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {authorName}
                        </p>
                        {authorEmail && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {authorEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {isPendingUpdateReview ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Bản sửa chờ duyệt
                      </span>
                    ) : ch.status === "PENDING_REVIEW" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Chờ duyệt
                      </span>
                    ) : ch.status === "PUBLISHED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đã xuất bản
                      </span>
                    ) : ch.status === "REJECTED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Bị từ chối
                      </span>
                    ) : (
                      <StatusBadge status={ch.status} />
                    )}
                  </td>

                  {/* Cột Phí đọc / Coin */}
                  <td className="py-3 px-4 text-center">
                    {ch.isFree ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold text-[11px]">
                        Cộng khai · {ch.coinPrice} Xu
                      </span>
                    )}
                  </td>

                  {/* Cột Lượt đọc */}
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-slate-700 text-xs">
                      {ch.viewCount ?? 0}
                    </span>
                  </td>

                  {/* Cột Thời gian */}
                  <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                    {timeStr}
                  </td>

                  {/* Cột Thao tác: 4 nút vuông/tròn bo góc nhỏ xíu: Xanh mắt, Xanh tick/Cấm, Vàng sửa, Đỏ xoá */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Nút Xem chi tiết nội dung chương */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(ch)}
                        className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Xem nội dung chi tiết chương"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </button>

                      {/* 1. Nếu đang PENDING_REVIEW hoặc có bản sửa chờ duyệt: Hiện nút Phê duyệt và Từ chối */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(ch)}
                            className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title={isPendingUpdateReview ? "Phê duyệt bản chỉnh sửa chương" : "Phê duyệt xuất bản chương"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(ch)}
                            className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title={isPendingUpdateReview ? "Từ chối bản chỉnh sửa chương (kèm lý do)" : "Từ chối chương (kèm lý do)"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* 2. Nếu đã PUBLISHED: Hiện nút Ẩn chương và nút Gỡ về Bản nháp */}
                      {isPublished && (
                        <>
                          {onHide && (
                            <button
                              type="button"
                              onClick={() => onHide(ch)}
                              className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                              title="Ẩn chương khỏi độc giả"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onUnpublish(ch)}
                            className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Gỡ duyệt chương (về bản nháp)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* 3. Nếu đang bị HIDDEN (Đã ẩn): Nút Mở lại hiển thị công khai */}
                      {ch.status === "HIDDEN" && onUnhide && (
                        <button
                          type="button"
                          onClick={() => onUnhide(ch)}
                          className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Bỏ ẩn - Mở lại hiển thị công khai cho độc giả"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}

                      {/* 4. Nếu đang REJECTED (Bị từ chối): Nút đưa quay lại hàng đợi chờ duyệt */}
                      {ch.status === "REJECTED" && onResetPending && (
                        <button
                          type="button"
                          onClick={() => onResetPending(ch)}
                          className="w-7 h-7 rounded-md border border-zinc-700/80 bg-white text-zinc-800 hover:bg-zinc-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Chuyển về chờ duyệt lại"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
