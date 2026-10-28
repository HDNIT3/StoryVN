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
import { notificationService, notificationKeys } from "@/features/notifications";
import { commentService } from "@/features/comments";
import type { Notification } from "@/features/notifications";
import { NotificationDropdown } from "./NotificationDropdown";

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

interface NotificationBellProps {
  className?: string;
  size?: "sm" | "md" | "lg";
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

  useEffect(() => {
    const handleNewNotification = () => {
      setIsRinging(true);
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
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

  const { data: unreadData } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: notificationKeys.list({ page: 1, limit: 20 }),
    queryFn: () => notificationService.getMyNotifications({ page: 1, limit: 20 }),
    enabled: isOpen,
    staleTime: 10_000,
  });

  const unreadCount = unreadData?.data?.unreadCount ?? 0;
  const notifications: Notification[] = listData?.data?.items ?? [];

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.markOneAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteOne(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const deleteReadMutation = useMutation({
    mutationFn: () => notificationService.deleteAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

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

  const handleMarkRead = useCallback(
    (id: string) => {
      markOneMutation.mutate(id);
    },
    [markOneMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteOneMutation.mutate(id);
    },
    [deleteOneMutation]
  );

  const router = useRouter();
  const { user } = useAuth();

  const handleNavigate = useCallback(
    async (notification: Notification) => {
      setIsOpen(false);
      if (notification.type === "MODERATION") {
        if (user?.role === "ADMIN" || user?.role === "MANAGER") {
          router.push("/quan-ly/duyet-tac-gia");
        } else {
          router.push("/tac-gia/dang-ky");
        }
        return;
      }

      if (notification.type === "NEW_CHAPTER") {
        const storySlug =
          typeof notification.storyId === "object" && notification.storyId !== null
            ? notification.storyId.slug
            : notification.storyId;
        const chapterNum =
          typeof notification.chapterId === "object" && notification.chapterId !== null
            ? notification.chapterId.chapterNumber
            : null;

        if (storySlug) {
          if (chapterNum) {
            router.push(`/truyen/${storySlug}/chuong/${chapterNum}`);
          } else {
            router.push(`/truyen/${storySlug}`);
          }
        }
        return;
      }

      if (notification.type === "COMMENT" || notification.type === "REPLY") {
        const commentId = notification.referenceId;
        let storySlug =
          typeof notification.storyId === "object" && notification.storyId !== null
            ? notification.storyId.slug
            : (notification.storyId as string | undefined);
        let chapterNum =
          typeof notification.chapterId === "object" && notification.chapterId !== null
            ? notification.chapterId.chapterNumber
            : null;
        let parentId: string | null = null;

        if (commentId) {
          try {
            const commentRes = await commentService.getCommentById(commentId);
            const commentData = commentRes?.data as any;
            if (commentData) {
              if (commentData.parentId) {
                parentId = typeof commentData.parentId === "object" ? commentData.parentId._id : commentData.parentId;
              }
              if (commentData.storyId && typeof commentData.storyId === "object") {
                storySlug = commentData.storyId.slug;
              }
              if (commentData.chapterId && typeof commentData.chapterId === "object") {
                chapterNum = commentData.chapterId.chapterNumber;
              }
            }
          } catch {
            // fallback to notification fields
          }
        }

        if (storySlug) {
          const queryParams = new URLSearchParams();
          if (commentId) queryParams.set("commentId", commentId);
          if (parentId) queryParams.set("parentId", parentId);

          if (chapterNum) {
            const hash = commentId ? `#comment-${commentId}` : "";
            router.push(`/truyen/${storySlug}/chuong/${chapterNum}?${queryParams.toString()}${hash}`);
          } else {
            queryParams.set("tab", "comments");
            const hash = commentId ? `#comment-${commentId}` : "";
            router.push(`/truyen/${storySlug}?${queryParams.toString()}${hash}`);
          }
        }
        return;
      }

      if (notification.type === "FOLLOW") {
        const storySlug =
          typeof notification.storyId === "object" && notification.storyId !== null
            ? notification.storyId.slug
            : notification.storyId;
        if (storySlug) {
          router.push(`/truyen/${storySlug}`);
        } else {
          router.push("/ho-so");
        }
        return;
      }

      if (notification.storyId) {
        const storySlug =
          typeof notification.storyId === "object" && notification.storyId !== null
            ? notification.storyId.slug
            : notification.storyId;
        router.push(`/truyen/${storySlug}`);
      }
    },
    [router, user]
  );

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-4 h-4 sm:w-5 sm:h-5",
    lg: "w-6 h-6",
  }[size];

  const buttonSize = {
    sm: "w-7 h-7",
    md: "w-7 h-7 sm:w-9 sm:h-9",
    lg: "w-10 h-10",
  }[size];

  const badgeSize = {
    sm: "text-[9px] min-w-[14px] h-[14px] -top-0.5 -right-0.5",
    md: "text-[9px] sm:text-[10px] min-w-[15px] sm:min-w-[16px] h-[15px] sm:h-[16px] -top-0.5 -right-0.5 sm:-top-1 sm:-right-1",
    lg: "text-xs min-w-[18px] h-[18px] -top-1 -right-1",
  }[size];

  const dropdownPositionClass = mobileDrawerMode
    ? "left-0 top-full mt-2"
    : "right-0 top-full mt-2";

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
          ${
            isOpen
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

        {unreadCount > 0 && (
          <span
            className={`absolute flex items-center justify-center px-1 rounded-full
              bg-red-500 text-white font-bold leading-none pointer-events-none
              ring-2 ring-white ${badgeSize}`}
          >
            {isRinging && (
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
            )}
            <span className="relative z-10">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <NotificationDropdown
          dropdownPositionClass={dropdownPositionClass}
          unreadCount={unreadCount}
          notifications={notifications}
          isLoading={isLoading}
          onMarkAllRead={() => markAllMutation.mutate()}
          isMarkingAllRead={markAllMutation.isPending}
          onDeleteRead={() => deleteReadMutation.mutate()}
          isDeletingRead={deleteReadMutation.isPending}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default NotificationBell;
