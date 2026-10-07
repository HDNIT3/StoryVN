"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { notificationService } from "@/lib/services/notification.service";
import type { Notification, NotificationType } from "@/types/notification";

// ─── Helpers ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  MODERATION: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  SYSTEM: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  NEW_CHAPTER: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: "text-sky-600",
    bg: "bg-sky-100",
  },
  FOLLOW: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  COMMENT: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  REPLY: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  FORUM: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// ─── Single Notification Item ─────────────────────────────────────
function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (notification: Notification) => void;
}) {
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.SYSTEM;

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3.5 transition-all duration-150 cursor-pointer
        ${notification.isRead
          ? "hover:bg-zinc-50/80"
          : "bg-sky-50/60 hover:bg-sky-50/90 border-l-[3px] border-sky-400"
        }`}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification._id);
        onNavigate(notification);
      }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${config.bg} ${config.color}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug truncate ${notification.isRead ? "text-zinc-700" : "text-zinc-900"}`}>
          {notification.title}
        </p>
        <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${notification.isRead ? "text-zinc-500" : "text-zinc-600"}`}>
          {notification.message}
        </p>
        <p className="text-[11px] text-zinc-400 mt-1 font-medium">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-500 mt-2 shadow-sm shadow-sky-300" />
      )}

      {/* Delete button (shown on hover) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification._id);
        }}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50"
        title="Xóa thông báo"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Bell Icon with badge ─────────────────────────────────────────
function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────
interface NotificationBellProps {
  /** Thêm className ngoài vào wrapper */
  className?: string;
  /** Icon size variant */
  size?: "sm" | "md" | "lg";
  /** Dùng trong mobile drawer — popup mở sang phải, không dùng Popper */
  mobileDrawerMode?: boolean;
}

export function NotificationBell({
  className = "",
  size = "md",
  mobileDrawerMode = false,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ── Lắng nghe sự kiện có thông báo mới đẩy realtime ─────────────
  useEffect(() => {
    const handleNewNotification = () => {
      setIsRinging(true);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
      // Nháy lắc chuông trong 4 giây rồi trở về bình thường
      ringTimeoutRef.current = setTimeout(() => {
        setIsRinging(false);
      }, 4000);
    };

    window.addEventListener("notification:new", handleNewNotification);
    return () => {
      window.removeEventListener("notification:new", handleNewNotification);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
    };
  }, []);

  // ── Queries ────────────────────────────────────────────────────
  const { data: unreadData } = useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30_000, // poll mỗi 30 giây
    staleTime: 15_000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list({ page: 1, limit: 20 }),
    queryFn: () => notificationService.getMyNotifications({ page: 1, limit: 20 }),
    enabled: isOpen,
    staleTime: 10_000,
  });

  const unreadCount = unreadData?.data?.unreadCount ?? 0;
  const notifications: Notification[] = listData?.data?.items ?? [];

  // ── Mutations ──────────────────────────────────────────────────
  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.markOneAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const deleteReadMutation = useMutation({
    mutationFn: () => notificationService.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // ── Close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = useCallback((id: string) => {
    markOneMutation.mutate(id);
  }, [markOneMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteOneMutation.mutate(id);
  }, [deleteOneMutation]);

  const router = useRouter();
  const { user } = useAuth();

  const handleNavigate = useCallback(
    (notification: Notification) => {
      setIsOpen(false);
      if (notification.type === "MODERATION") {
        if (user?.role === "ADMIN" || user?.role === "MANAGER") {
          router.push("/quan-ly/duyet-tac-gia");
        } else {
          router.push("/tac-gia/dang-ky");
        }
      } else if (notification.type === "NEW_CHAPTER" && notification.storyId) {
        if (notification.chapterId) {
          router.push(`/truyen/${notification.storyId}/${notification.chapterId}`);
        } else {
          router.push(`/truyen/${notification.storyId}`);
        }
      }
    },
    [router, user]
  );

  // ── Sizing ─────────────────────────────────────────────────────
  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  const buttonSize = {
    sm: "w-7 h-7",
    md: "w-8 h-8 sm:w-9 sm:h-9",
    lg: "w-10 h-10",
  }[size];

  const badgeSize = {
    sm: "text-[9px] min-w-[14px] h-[14px] -top-0.5 -right-0.5",
    md: "text-[10px] min-w-[16px] h-[16px] -top-1 -right-1",
    lg: "text-xs min-w-[18px] h-[18px] -top-1 -right-1",
  }[size];

  // ── Dropdown position ─────────────────────────────────────────
  const dropdownPositionClass = mobileDrawerMode
    ? "left-0 top-full mt-2"
    : "right-0 top-full mt-2";

  const hasRead = notifications.some((n) => n.isRead);

  return (
    <div ref={dropdownRef} className={`relative inline-block shrink-0 ${className}`}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => {
          setIsRinging(false);
          setIsOpen((prev) => !prev);
        }}
        aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative flex items-center justify-center ${buttonSize} rounded-full
          transition-all duration-150 cursor-pointer
          ${isOpen
            ? "bg-sky-50 text-sky-600"
            : isRinging
              ? "text-amber-600 bg-amber-50 ring-2 ring-amber-300"
              : "text-zinc-600 hover:text-sky-600 hover:bg-sky-50"
          }
        `}
      >
        <BellIcon
          className={`${iconSize} transition-transform ${
            isRinging
              ? "animate-bell-ring text-amber-500"
              : isOpen
                ? "rotate-12"
                : ""
          }`}
        />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute flex items-center justify-center px-1 rounded-full
              bg-red-500 text-white font-bold leading-none pointer-events-none
              ring-2 ring-white ${badgeSize}`}
          >
            {/* Hiệu ứng radar ping nhấp nháy khi có thông báo mới reo */}
            {isRinging && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
            )}
            <span className="relative z-10">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Thông báo"
          className={`absolute ${dropdownPositionClass} z-[60]
            w-[340px] sm:w-[380px] max-w-[calc(100vw-24px)]
            bg-white rounded-2xl shadow-2xl border border-zinc-100
            overflow-hidden
            animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <BellIcon className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-bold text-zinc-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700 leading-none">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  title="Đánh dấu tất cả đã đọc"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Đọc hết
                </button>
              )}
              {hasRead && (
                <button
                  type="button"
                  onClick={() => deleteReadMutation.mutate()}
                  disabled={deleteReadMutation.isPending}
                  title="Xóa thông báo đã đọc"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa đã đọc
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-zinc-50">
            {isLoading ? (
              // Skeleton loading
              <div className="divide-y divide-zinc-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-100 rounded w-3/4" />
                      <div className="h-2.5 bg-zinc-100 rounded w-full" />
                      <div className="h-2 bg-zinc-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                  <BellIcon className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-700">Chưa có thông báo nào</p>
                <p className="text-xs text-zinc-400 mt-1">Các thông báo mới sẽ hiển thị ở đây</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/50">
              <p className="text-[11px] text-zinc-400 text-center">
                Hiển thị {notifications.length} thông báo gần nhất
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
