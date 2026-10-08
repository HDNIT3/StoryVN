"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem, StoryStatus, StoryVisibility } from "@/types/story";

interface Props {
  stories: AdminStoryItem[];
  isLoading: boolean;
  onViewDetail: (story: AdminStoryItem) => void;
  onApprove: (story: AdminStoryItem) => void;
  onReject: (story: AdminStoryItem) => void;
  onUnpublish: (story: AdminStoryItem) => void;
  onHide: (story: AdminStoryItem) => void;
  onUnhide: (story: AdminStoryItem) => void;
}

function StoryCoverThumb({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300 p-1 text-center select-none">
        <svg className="w-4 h-4 mb-0.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[9px] font-bold text-slate-400">Bìa</span>
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

function AuthorAvatarThumb({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs"
    />
  );
}

export function StoryTable({
  stories,
  isLoading,
  onViewDetail,
  onApprove,
  onReject,
  onUnpublish,
  onHide,
  onUnhide,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-500 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Đang tải danh sách tác phẩm...</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy tác phẩm nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Không có dữ liệu tác phẩm phù hợp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc trạng thái lọc.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status: StoryStatus) => {
    switch (status) {
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ xét duyệt
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã xuất bản
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bị từ chối
          </span>
        );
      case "DRAFT":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Bản nháp
          </span>
        );
    }
  };

  const renderVisibilityBadge = (visibility: StoryVisibility) => {
    if (visibility === "PRIVATE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200" title="Chế độ riêng tư / Đang bị ẩn khỏi độc giả">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
          Bị ẩn (Private)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
        Công khai
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Tác phẩm</th>
              <th className="py-3.5 px-4">Tác giả</th>
              <th className="py-3.5 px-4 text-center">Thống kê</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Hiển thị</th>
              <th className="py-3.5 px-4">Ngày tạo</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {stories.map((story) => {
              const author = typeof story.authorId === "object" ? story.authorId : null;
              const authorName =
                story.authorProfile?.penName ||
                author?.displayName ||
                author?.username ||
                "Chưa xác định";

              const isPending = story.status === "PENDING_REVIEW";
              const isPublished = story.status === "PUBLISHED";
              const isPrivate = story.visibility === "PRIVATE";

              return (
                <tr
                  key={story._id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Cột Tác phẩm */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Bìa truyện an toàn */}
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs relative">
                        <StoryCoverThumb src={story.coverUrl} alt={story.title} />
                      </div>

                      <div className="min-w-0 max-w-xs">
                        <button
                          type="button"
                          onClick={() => onViewDetail(story)}
                          className="font-bold text-slate-900 hover:text-sky-600 transition-colors truncate block text-left text-sm cursor-pointer"
                          title={story.title}
                        >
                          {story.title}
                        </button>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          /{story.slug}
                        </p>

                        {/* Thể loại tags tóm tắt */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {story.genreIds?.slice(0, 2).map((g: any) => (
                            <span
                              key={g._id || g}
                              className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium"
                            >
                              {g.name || "Thể loại"}
                            </span>
                          ))}
                          {story.genreIds && story.genreIds.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{story.genreIds.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột Tác giả */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <AuthorAvatarThumb src={author?.avatarUrl} name={authorName} />
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
                    </div>
                  </td>

                  {/* Cột Thống kê */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-bold text-slate-800 text-xs">
                        {story.stats?.chapterCount ?? 0} chương
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {story.stats?.viewCount?.toLocaleString() ?? 0} lượt xem
                      </span>
                    </div>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderStatusBadge(story.status)}
                    {story.rejectReason && story.status === "REJECTED" && (
                      <p
                        className="text-[11px] text-rose-500 max-w-[140px] truncate mt-0.5"
                        title={story.rejectReason}
                      >
                        Lý do: {story.rejectReason}
                      </p>
                    )}
                  </td>

                  {/* Cột Hiển thị */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderVisibilityBadge(story.visibility)}
                  </td>

                  {/* Cột Ngày tạo */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                    {story.createdAt
                      ? new Date(story.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Cột Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(story)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết tác phẩm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Nếu Đang Chờ duyệt -> Hiện nút Duyệt và Từ chối */}
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(story)}
                            className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            title="Phê duyệt tác phẩm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(story)}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-500 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Từ chối phê duyệt"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Nếu Đã xuất bản -> Nút Gỡ duyệt */}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => onUnpublish(story)}
                          className="p-1.5 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
                          title="Gỡ duyệt tác phẩm (chuyển về bản nháp)"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}

                      {/* Ẩn public hoặc Mở lại public */}
                      {isPrivate ? (
                        <button
                          type="button"
                          onClick={() => onUnhide(story)}
                          className="p-1.5 text-purple-600 hover:text-white hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
                          title="Mở lại hiển thị công khai"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onHide(story)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Cấm / Ẩn tác phẩm khỏi chế độ công khai"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
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
