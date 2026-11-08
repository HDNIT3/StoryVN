"use client";

import React from "react";
import Link from "next/link";
import type {
  AuthorRecentCommentItem,
  AuthorRecentNotificationItem,
} from "../../types";

interface RecentActivityProps {
  comments?: AuthorRecentCommentItem[];
  notifications?: AuthorRecentNotificationItem[];
  isLoading?: boolean;
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Vừa xong";
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 60_000) return "Vừa xong";
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
  } catch {
    return "Vừa xong";
  }
}

function getNotificationIcon(type?: string): string {
  switch (type) {
    case "NEW_CHAPTER":
      return "📖";
    case "STORY_MILESTONE":
      return "🎉";
    case "COMMENT":
    case "COMMENT_REPLY":
      return "💬";
    case "WALLET":
    case "COIN":
      return "💰";
    default:
      return "📢";
  }
}

export function RecentActivity({
  comments = [],
  notifications = [],
  isLoading = false,
}: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
      {/* Latest Comments */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">Bình luận mới nhất</span>
          </h3>
          <Link
            href="/tac-gia/tac-pham"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition shrink-0"
          >
            Xem tác phẩm →
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-start gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-10 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5 text-xl">
              💬
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              Chưa có bình luận nào
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Khi độc giả bình luận ở tác phẩm hoặc chương truyện của bạn, nội dung sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {comments.map((comment) => {
              const displayName =
                comment.user?.displayName || comment.user?.username || "Độc giả";
              const storyTitle = comment.story?.title || "Tác phẩm";
              const storySlug = comment.story?.slug || "";
              const chapterNum = comment.chapter?.chapterNumber;
              const targetHref =
                storySlug && chapterNum
                  ? `/truyen/${storySlug}/chuong/${chapterNum}`
                  : storySlug
                  ? `/truyen/${storySlug}`
                  : "/tac-gia/tac-pham";

              return (
                <div
                  key={comment._id}
                  className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs overflow-hidden">
                    {comment.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.user.avatarUrl}
                        alt={displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <strong className="font-semibold text-slate-900">
                        {displayName}
                      </strong>
                      <span>đã bình luận ở</span>
                      <Link
                        href={targetHref}
                        className="text-sky-600 font-medium hover:underline truncate max-w-[160px] sm:max-w-[220px]"
                      >
                        {storyTitle}
                        {chapterNum ? ` - Chương ${chapterNum}` : ""}
                      </Link>
                      <span className="text-slate-400">
                        • {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-2.5 border border-slate-100 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications & Recent Milestones */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Hoạt động & Thông báo</span>
          </h3>
          <Link
            href="/tac-gia/chuong-truyen"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition shrink-0"
          >
            Quản lý chương →
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-start gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2.5 text-xl">
              🔔
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              Chưa có thông báo mới
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Các thông báo duyệt chương, cột mốc lượt đọc và tương tác mới sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => {
              const href =
                notif.storySlug && notif.chapterNumber
                  ? `/truyen/${notif.storySlug}/chuong/${notif.chapterNumber}`
                  : notif.storySlug
                  ? `/truyen/${notif.storySlug}`
                  : null;

              const inner = (
                <div className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 transition">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-lg">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 mb-0.5 leading-snug break-words">
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="text-xs text-slate-600 mb-1 leading-relaxed break-words">
                        {notif.message}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              );

              return href ? (
                <Link key={notif._id} href={href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={notif._id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
