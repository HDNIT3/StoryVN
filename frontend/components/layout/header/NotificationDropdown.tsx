"use client";

import React from "react";
import type { Notification } from "@/features/notifications";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  dropdownPositionClass: string;
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  onMarkAllRead: () => void;
  isMarkingAllRead: boolean;
  onDeleteRead: () => void;
  isDeletingRead: boolean;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (notification: Notification) => void;
}

export function NotificationDropdown({
  dropdownPositionClass,
  unreadCount,
  notifications,
  isLoading,
  onMarkAllRead,
  isMarkingAllRead,
  onDeleteRead,
  isDeletingRead,
  onMarkRead,
  onDelete,
  onNavigate,
}: NotificationDropdownProps) {
  const hasRead = notifications.some((n) => n.isRead);

  return (
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
          <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
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
              onClick={onMarkAllRead}
              disabled={isMarkingAllRead}
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
              onClick={onDeleteRead}
              disabled={isDeletingRead}
              title="Xóa thông báo đã đọc"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Xóa đã đọc
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-zinc-50">
        {isLoading ? (
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
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-700">Chưa có thông báo nào</p>
            <p className="text-xs text-zinc-400 mt-1">Các thông báo mới sẽ hiển thị ở đây</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onNavigate={onNavigate}
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
  );
}
