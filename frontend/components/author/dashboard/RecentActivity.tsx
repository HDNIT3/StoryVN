"use client";

import React from "react";
import Link from "next/link";

interface Comment {
  id: string;
  username: string;
  avatarUrl?: string;
  storyTitle: string;
  storySlug: string;
  content: string;
  timeAgo: string;
}

interface Notification {
  id: string;
  icon: string;
  content: string;
  timeAgo: string;
}

const mockComments: Comment[] = [
  {
    id: "1",
    username: "Trần Minh",
    storyTitle: "Thiên Đạo Chi Lộ",
    storySlug: "thien-dao-chi-lo",
    content: "Truyện rất hay! Mong tác giả ra chương mới sớm ạ!",
    timeAgo: "2 giờ trước",
  },
  {
    id: "2",
    username: "Linh Nguyễn",
    storyTitle: "Dưới Bầu Trời Sao",
    storySlug: "duoi-bau-troi-sao",
    content: "Chương mới quá cảm động, cảm ơn tác giả ❤️",
    timeAgo: "5 giờ trước",
  },
  {
    id: "3",
    username: "Hùng Vũ",
    storyTitle: "Thiên Đạo Chi Lộ",
    storySlug: "thien-dao-chi-lo",
    content: "Plot twist chương 45 thật sự bất ngờ!",
    timeAgo: "1 ngày trước",
  },
];

const mockNotifications: Notification[] = [
  {
    id: "1",
    icon: "🎉",
    content: "Tác phẩm của bạn đã đạt 100K lượt đọc!",
    timeAgo: "3 ngày trước",
  },
  {
    id: "2",
    icon: "📢",
    content: "Chương mới của \"Thiên Đạo Chi Lộ\" đã được duyệt.",
    timeAgo: "5 ngày trước",
  },
  {
    id: "3",
    icon: "💰",
    content: "Bạn nhận được 50,000 xu từ độc giả.",
    timeAgo: "1 tuần trước",
  },
];

export function RecentActivity() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
      {/* Latest Comments */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Bình luận mới nhất
          </h3>
          <Link
            href="/tac-gia/tac-pham"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {mockComments.map((comment) => (
            <div key={comment.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 transition">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                {comment.avatarUrl ? (
                  <img src={comment.avatarUrl} alt={comment.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  comment.username.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <strong className="font-semibold text-slate-900">{comment.username}</strong>
                  <span>đã bình luận ở</span>
                  <Link href={`/truyen/${comment.storySlug}`} className="text-sky-600 font-medium hover:underline truncate max-w-[150px]">
                    {comment.storyTitle}
                  </Link>
                  <span className="text-slate-400">• {comment.timeAgo}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Thông báo
          </h3>
          <Link
            href="/thong-bao"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {mockNotifications.map((notif) => (
            <div key={notif.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-lg">
                {notif.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 mb-1 leading-snug">
                  {notif.content}
                </p>
                <span className="text-[11px] text-slate-400">{notif.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
