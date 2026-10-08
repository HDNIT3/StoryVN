"use client";

import React from "react";
import Image from "next/image";
import type { AdminStoryItem } from "@/types/story";

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Chi tiết tác phẩm
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung chi tiết có cuộn */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Cảnh báo lý do nếu bị từ chối hoặc bị ẩn */}
          {story.rejectReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-bold text-rose-900">Ghi chú / Lý do từ ban quản trị:</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{story.rejectReason}</p>
              </div>
            </div>
          )}

          {/* Phần trên: Bìa truyện + Thông tin chính */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Ảnh bìa an toàn */}
            <div className="w-32 sm:w-40 h-44 sm:h-56 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-md relative mx-auto sm:mx-0">
              <StoryCoverLarge src={story.coverUrl} alt={story.title} />
            </div>

            {/* Chi tiết thông tin */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <h4 className="text-xl font-black text-slate-900 leading-tight">
                  {story.title}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Đường dẫn: /{story.slug}
                </p>
              </div>

              {/* Các huy hiệu trạng thái */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Trạng thái kiểm duyệt */}
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                  {story.status === "PENDING_REVIEW" && "⏳ Đang chờ duyệt"}
                  {story.status === "PUBLISHED" && "✅ Đã xuất bản"}
                  {story.status === "REJECTED" && "❌ Bị từ chối"}
                  {story.status === "DRAFT" && "📝 Bản nháp"}
                </span>

                {/* Hiển thị */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  story.visibility === "PRIVATE" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                }`}>
                  {story.visibility === "PRIVATE" ? "🔒 Riêng tư (Bị ẩn)" : "🌐 Công khai"}
                </span>

                {/* Độ tuổi */}
                {story.ageRating && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Độ tuổi: {story.ageRating}
                  </span>
                )}

                {/* Tiến độ */}
                {story.progressState && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {story.progressState === "ONGOING" && "Đang ra"}
                    {story.progressState === "COMPLETED" && "Hoàn thành"}
                    {story.progressState === "ON_HOLD" && "Tạm dừng"}
                  </span>
                )}
              </div>

              {/* Tác giả */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center gap-3">
                <AuthorAvatarModal src={author?.avatarUrl} name={authorName} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    Tác giả: {authorName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
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
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Số chương</p>
                  <p className="text-sm font-black text-slate-800">
                    {story.stats?.chapterCount ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Lượt xem</p>
                  <p className="text-sm font-black text-slate-800">
                    {story.stats?.viewCount?.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Theo dõi</p>
                  <p className="text-sm font-black text-slate-800">
                    {story.stats?.followCount ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Đánh giá</p>
                  <p className="text-sm font-black text-amber-600">
                    ★ {story.stats?.ratingAverage ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thể loại & Tag */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Thể loại & Thẻ tag
            </p>
            <div className="flex flex-wrap gap-1.5">
              {story.genreIds?.map((g: any) => (
                <span
                  key={g._id || g}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100"
                >
                  #{g.name || "Thể loại"}
                </span>
              ))}
              {story.tagIds?.map((t: any) => (
                <span
                  key={t._id || t}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600"
                >
                  {t.name || "Tag"}
                </span>
              ))}
            </div>
          </div>

          {/* Giới thiệu nội dung truyện */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Giới thiệu tác phẩm
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
              {story.description || "Tác phẩm chưa có nội dung giới thiệu."}
            </div>
          </div>

          {/* Lời nhắn của tác giả */}
          {story.authorNote && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Lời nhắn của tác giả
              </p>
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                {story.authorNote}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal: Các nút hành động */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Phê duyệt / Từ chối (Nếu đang chờ duyệt) */}
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReject(story);
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Từ chối duyệt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApprove(story);
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Phê duyệt tác phẩm
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
                className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
                className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
                className="px-4 py-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
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
