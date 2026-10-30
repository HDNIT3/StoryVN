"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem, StoryStatus, StoryVisibility } from "@/features/stories";

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
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-3">Tác phẩm</th>
              <th className="py-2.5 px-3">Tác giả</th>
              <th className="py-2.5 px-3 text-center">Thống kê</th>
              <th className="py-2.5 px-3">Trạng thái & Hiển thị</th>
              <th className="py-2.5 px-3">Ngày tạo</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
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
              const isRevisionPending = Boolean(
                story.isPendingReview &&
                  story.pendingRevision?.status === "PENDING_REVIEW"
              );
              const canModerate = isPending || isRevisionPending;

              return (
                <tr
                  key={story._id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Cột Tác phẩm */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      {/* Bìa truyện an toàn */}
                      <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs relative">
                        <StoryCoverThumb src={story.coverUrl} alt={story.title} />
                      </div>

                      <div className="min-w-0 max-w-[180px] xl:max-w-[240px]">
                        <button
                          type="button"
                          onClick={() => onViewDetail(story)}
                          className="font-bold text-slate-900 hover:text-sky-600 transition-colors truncate block text-left text-xs sm:text-[13px] cursor-pointer"
                          title={story.title}
                        >
                          {story.title}
                        </button>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          /{story.slug}
                        </p>

                        {/* Thể loại tags tóm tắt */}
                        <div className="flex items-center gap-1 mt-0.5">
                          {story.genreIds?.[0] && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate max-w-[90px]">
                              {(story.genreIds[0] as any).name || "Thể loại"}
                            </span>
                          )}
                          {story.genreIds && story.genreIds.length > 1 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{story.genreIds.length - 1}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột Tác giả */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <AuthorAvatarThumb src={author?.avatarUrl} name={authorName} />
                      <div className="min-w-0 max-w-[100px] xl:max-w-[130px]">
                        <p className="font-semibold text-slate-800 text-xs truncate" title={authorName}>
                          {authorName}
                        </p>
                        {author?.email && (
                          <p className="text-[10px] text-slate-400 truncate" title={author.email}>
                            {author.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột Thống kê */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <a
                      href={`/quan-ly/chuong?storyId=${story._id}`}
                      className="font-bold text-sky-600 hover:text-sky-700 hover:underline text-xs block"
                      title="Xem và quản lý các chương của tác phẩm này"
                    >
                      {story.stats?.chapterCount ?? 0} chương ↗
                    </a>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {story.stats?.wordCount?.toLocaleString("vi-VN") ?? 0} từ
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {story.stats?.viewCount?.toLocaleString() ?? 0} lượt xem
                    </span>
                  </td>

                  {/* Cột Trạng thái & Hiển thị kết hợp */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderStatusBadge(story.status)}
                        {isRevisionPending && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                            title="Tác phẩm có bản chỉnh sửa đang chờ duyệt"
                          >
                            Bản sửa chờ duyệt
                          </span>
                        )}
                        {story.visibility === "PRIVATE" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200" title="Chế độ riêng tư / Đang bị ẩn khỏi độc giả">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                            Ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            Công khai
                          </span>
                        )}
                      </div>
                      {story.rejectReason && (
                        <p
                          className={`text-[10px] max-w-[140px] truncate ${
                            story.visibility === "PRIVATE"
                              ? "text-purple-600"
                              : story.status === "DRAFT"
                              ? "text-amber-700"
                              : "text-rose-500"
                          }`}
                          title={story.rejectReason}
                        >
                          {story.visibility === "PRIVATE"
                            ? "Lý do ẩn: "
                            : story.status === "DRAFT"
                            ? "Lý do gỡ: "
                            : "Lý do: "}
                          {story.rejectReason}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Cột Ngày tạo */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-500">
                    {story.createdAt
                      ? new Date(story.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  {/* Cột Thao tác */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(story)}
                        className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        title="Xem chi tiết tác phẩm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Khi đang PENDING_REVIEW hoặc có bản sửa chờ duyệt: Nút Phê duyệt và Từ chối */}
                      {canModerate && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(story)}
                            className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title={
                              isRevisionPending
                                ? "Phê duyệt bản sửa tác phẩm"
                                : "Phê duyệt tác phẩm"
                            }
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(story)}
                            className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title={
                              isRevisionPending
                                ? "Từ chối bản sửa tác phẩm"
                                : "Từ chối phê duyệt tác phẩm"
                            }
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Khi đã PUBLISHED: Nút Gỡ duyệt */}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => onUnpublish(story)}
                          className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Gỡ duyệt tác phẩm (chuyển về bản nháp)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                      )}

                      {/* Nút Ẩn / Mở lại công khai */}
                      {isPrivate ? (
                        <button
                          type="button"
                          onClick={() => onUnhide(story)}
                          className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Mở lại hiển thị công khai (Bỏ ẩn)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onHide(story)}
                          className="w-7 h-7 rounded-md border border-slate-700/80 bg-white text-slate-800 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Ẩn khỏi chế độ công khai (Chuyển sang Riêng tư)"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

