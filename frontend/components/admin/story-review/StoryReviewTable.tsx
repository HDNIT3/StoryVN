"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem } from "@/types/story";

interface Props {
  items: AdminStoryItem[];
  isLoading: boolean;
  onViewDetail: (story: AdminStoryItem) => void;
  onOpenReview: (story: AdminStoryItem, action: "APPROVED" | "REJECTED") => void;
}

export function StoryReviewTable({
  items,
  isLoading,
  onViewDetail,
  onOpenReview,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Đang tải dữ liệu tác phẩm...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không có tác phẩm nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Hiện không có tác phẩm nào phù hợp với bộ lọc này hoặc tất cả yêu cầu đã được xử lý.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (story: AdminStoryItem) => {
    switch (story.status) {
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ kiểm duyệt
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã xuất bản
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bị từ chối
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Bản nháp
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Tác phẩm</th>
              <th className="py-3 px-4">Tác giả</th>
              <th className="py-3 px-4">Thể loại & Phân loại</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Ngày gửi</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((story) => {
              const authorPenName =
                story.author?.penName ||
                (typeof story.authorId === "object"
                  ? story.authorId?.displayName
                  : "Tác giả");
              const authorEmail =
                story.author?.email ||
                (typeof story.authorId === "object"
                  ? story.authorId?.email
                  : "");

              const hasAppeal = Boolean(story.authorFeedback?.trim());

              return (
                <tr
                  key={story._id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Cột 1: Tác phẩm (Bìa, Tiêu đề, Slug) */}
                  <td className="py-3.5 px-4 min-w-[260px]">
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {story.coverUrl ? (
                          <Image
                            src={story.coverUrl}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400">
                            <span>Chưa có</span>
                            <span>ảnh bìa</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onViewDetail(story)}
                          className="font-bold text-slate-900 hover:text-sky-600 transition-colors text-left line-clamp-1"
                        >
                          {story.title}
                        </button>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          /{story.slug}
                        </p>
                        {hasAppeal && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            💬 Tác giả có phản hồi khiếu nại
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Tác giả */}
                  <td className="py-3.5 px-4 min-w-[160px]">
                    <div className="font-semibold text-slate-900 truncate">
                      {authorPenName}
                    </div>
                    {authorEmail && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {authorEmail}
                      </div>
                    )}
                  </td>

                  {/* Cột 3: Thể loại & Phân loại */}
                  <td className="py-3.5 px-4 min-w-[180px]">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {story.genreIds && story.genreIds.length > 0 ? (
                        story.genreIds.slice(0, 2).map((g) => (
                          <span
                            key={g._id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                          >
                            {g.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">Chưa gắn</span>
                      )}
                      {story.genreIds && story.genreIds.length > 2 && (
                        <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500">
                          +{story.genreIds.length - 2}
                        </span>
                      )}
                    </div>
                    {story.ageRating && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500">
                        Độ tuổi: <strong className="text-slate-700">{story.ageRating}</strong>
                      </span>
                    )}
                  </td>

                  {/* Cột 4: Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderStatusBadge(story)}
                  </td>

                  {/* Cột 5: Ngày gửi */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                    {story.createdAt
                      ? new Date(story.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Cột 6: Thao tác */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetail(story)}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-100"
                      >
                        Chi tiết
                      </button>

                      {story.status === "PENDING_REVIEW" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenReview(story, "APPROVED")}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                            title="Phê duyệt nhanh"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReview(story, "REJECTED")}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                            title="Từ chối nhanh"
                          >
                            Từ chối
                          </button>
                        </>
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
