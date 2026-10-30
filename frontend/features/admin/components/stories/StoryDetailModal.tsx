"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem } from "@/features/stories";

interface Props {
  story: AdminStoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (story: AdminStoryItem) => void;
  onReject: (story: AdminStoryItem) => void;
  onUnpublish: (story: AdminStoryItem) => void;
  onHide: (story: AdminStoryItem) => void;
  onUnhide: (story: AdminStoryItem) => void;
}

function StoryCoverLarge({ src, alt }: { src?: string | null; alt: string }) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center select-none">
        <svg className="w-10 h-10 mb-1.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-semibold text-slate-400">Chưa có ảnh bìa</span>
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

function AuthorAvatarModal({ src, name }: { src?: string | null; name: string }) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
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
      className="w-10 h-10 rounded-full object-cover shrink-0"
    />
  );
}

export function StoryDetailModal({
  story,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onUnpublish,
  onHide,
  onUnhide,
}: Props) {
  if (!isOpen || !story) return null;

  const author = typeof story.authorId === "object" ? story.authorId : null;
  const authorName =
    story.authorProfile?.penName ||
    author?.displayName ||
    author?.username ||
    "Chưa xác định";

  const isPending = story.status === "PENDING_REVIEW";
  const isPublished = story.status === "PUBLISHED";
  const isPrivate = story.visibility === "PRIVATE";

  const pendingRevision = story.pendingRevision ?? null;
  const isPendingRevisionReview = Boolean(
    story.isPendingReview &&
      pendingRevision &&
      pendingRevision.status === "PENDING_REVIEW"
  );

  // Khi duyệt bản sửa: hiển thị nội dung của bản sửa thay vì bản đang phát hành
  const displayTitle = isPendingRevisionReview
    ? pendingRevision?.title || story.title
    : story.title;
  const displayCoverUrl = isPendingRevisionReview
    ? pendingRevision?.coverUrl ?? story.coverUrl
    : story.coverUrl;
  const displayDescription = isPendingRevisionReview
    ? pendingRevision?.description ?? story.description
    : story.description;
  const displayAuthorNote = isPendingRevisionReview
    ? pendingRevision?.authorNote ?? story.authorNote
    : story.authorNote;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[88vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Chi tiết tác phẩm
              </h3>
              <p className="text-[11px] text-slate-500">
                Xem nội dung trước khi phê duyệt hoặc xử lý tác phẩm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung chi tiết có cuộn */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Cảnh báo lý do nếu bị từ chối hoặc bị ẩn */}
          {story.rejectReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-xs">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-rose-900">Ghi chú / Lý do từ ban quản trị:</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{story.rejectReason}</p>
              </div>
            </div>
          )}

          {/* Bản sửa đang chờ duyệt của tác phẩm đã xuất bản */}
          {isPendingRevisionReview && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-xs">
              <svg className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <div>
                <p className="font-bold text-amber-900">Đang duyệt bản chỉnh sửa tác phẩm</p>
                <p className="text-amber-700 mt-0.5 leading-relaxed">
                  Nội dung bên dưới là bản sửa chờ duyệt. Bản đang phát hành vẫn hiển thị với độc giả cho tới khi bạn phê duyệt.
                </p>
              </div>
            </div>
          )}

          {/* Phần trên: Bìa truyện + Thông tin chính */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Ảnh bìa an toàn */}
            <div className="w-28 sm:w-32 h-40 sm:h-44 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs relative mx-auto sm:mx-0">
              <StoryCoverLarge src={displayCoverUrl} alt={displayTitle} />
            </div>

            {/* Chi tiết thông tin */}
            <div className="flex-1 min-w-0 space-y-2.5 w-full">
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-snug break-words">
                  {displayTitle}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  /{story.slug}
                </p>
              </div>

              {/* Các huy hiệu trạng thái */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Trạng thái kiểm duyệt */}
                <span
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                    story.status === "PENDING_REVIEW"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : story.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : story.status === "REJECTED"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {story.status === "PENDING_REVIEW" && "Đang chờ duyệt"}
                  {story.status === "PUBLISHED" && "Đã xuất bản"}
                  {story.status === "REJECTED" && "Bị từ chối"}
                  {story.status === "DRAFT" && "Bản nháp"}
                </span>

                {isPendingRevisionReview && (
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
                    Bản sửa chờ duyệt
                  </span>
                )}

                {/* Hiển thị */}
                <span
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                    isPrivate
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-sky-50 text-sky-700 border-sky-200"
                  }`}
                >
                  {isPrivate ? "Riêng tư (Bị ẩn)" : "Công khai"}
                </span>

                {/* Độ tuổi */}
                {story.ageRating && (
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                    Độ tuổi: {story.ageRating}
                  </span>
                )}

                {/* Tiến độ */}
                {story.progressState && (
                  <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                    {story.progressState === "ONGOING" && "Đang ra"}
                    {story.progressState === "COMPLETED" && "Hoàn thành"}
                    {story.progressState === "ON_HOLD" && "Tạm dừng"}
                  </span>
                )}
              </div>

              {/* Tác giả */}
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 flex items-center gap-2.5">
                <AuthorAvatarModal src={author?.avatarUrl} name={authorName} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate">
                    Tác giả: {authorName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {author?.email || "Chưa có email"}
                  </p>
                  {story.authorProfile?.bio && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      Bio: {story.authorProfile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Thống kê tác phẩm */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <p className="text-[10px] text-slate-400">Chương</p>
                  <p className="text-xs font-bold text-slate-800">
                    {story.stats?.chapterCount ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <p className="text-[10px] text-slate-400">Lượt xem</p>
                  <p className="text-xs font-bold text-slate-800">
                    {story.stats?.viewCount?.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <p className="text-[10px] text-slate-400">Theo dõi</p>
                  <p className="text-xs font-bold text-slate-800">
                    {story.stats?.followCount ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <p className="text-[10px] text-slate-400">Đánh giá</p>
                  <p className="text-xs font-bold text-amber-600">
                    ★ {story.stats?.ratingAverage ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thể loại & Tag */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Thể loại & Thẻ tag
            </p>
            <div className="flex flex-wrap gap-1.5">
              {story.genreIds?.map((g: any) => (
                <span
                  key={g._id || g}
                  className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200"
                >
                  {g.name || "Thể loại"}
                </span>
              ))}
              {story.tagIds?.map((t: any) => (
                <span
                  key={t._id || t}
                  className="px-2 py-0.5 rounded-sm text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200"
                >
                  #{t.name || "Tag"}
                </span>
              ))}
              {!story.genreIds?.length && !story.tagIds?.length && (
                <span className="text-[11px] text-slate-400">
                  Chưa gắn thể loại / thẻ tag.
                </span>
              )}
            </div>
          </div>

          {/* Giới thiệu nội dung truyện */}
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Giới thiệu tác phẩm
            </p>
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
              {displayDescription || "Tác phẩm chưa có nội dung giới thiệu."}
            </div>
          </div>

          {/* Lời nhắn của tác giả */}
          {displayAuthorNote && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Lời nhắn của tác giả
              </p>
              <div className="bg-amber-50/60 p-3 rounded-md border border-amber-200/70 text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">
                {displayAuthorNote}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal: Các nút hành động */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Phê duyệt / Từ chối (Nếu đang chờ duyệt) */}
            {(isPending || isPendingRevisionReview) && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReject(story);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {isPendingRevisionReview ? "Từ chối bản sửa" : "Từ chối duyệt"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(story);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  {isPendingRevisionReview ? "Phê duyệt bản sửa" : "Phê duyệt tác phẩm"}
                </button>
              </>
            )}

            {/* Gỡ duyệt (Nếu đang xuất bản) */}
            {isPublished && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUnpublish(story);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Gỡ duyệt tác phẩm
              </button>
            )}

            {/* Ẩn / Mở lại công khai */}
            {isPrivate ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUnhide(story);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Mở lại công khai
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onHide(story);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
              >
                Cấm / Ẩn công khai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

