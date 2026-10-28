"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";

interface CommentInputBoxProps {
  onSubmit: (content: string) => Promise<void> | void;
  isSubmitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  replyToName?: string;
  onClearReplyTo?: () => void;
}

export const CommentInputBox: React.FC<CommentInputBoxProps> = ({
  onSubmit,
  isSubmitting = false,
  placeholder = "Để lại suy nghĩ hoặc lời nhận xét của bạn...",
  autoFocus = false,
  onCancel,
  replyToName,
  onClearReplyTo,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-center space-y-2">
        <p className="text-xs sm:text-sm text-zinc-600 font-medium">
          Bạn cần đăng nhập để tham gia thảo luận và bình luận.
        </p>
        <Link
          href="/dang-nhap"
          className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
        >
          Đăng nhập để bình luận
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    await onSubmit(trimmed);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      {/* Avatar */}
      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName || user.username}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-xs sm:text-sm text-emerald-800 bg-emerald-100">
            {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Input container */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl border border-zinc-200 p-2.5 sm:p-3 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all shadow-2xs">
        {replyToName && (
          <div className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Đang trả lời:</span>
              <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                @{replyToName}
              </span>
            </div>
            {onClearReplyTo && (
              <button
                type="button"
                onClick={onClearReplyTo}
                title="Hủy gắn thẻ trả lời"
                className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded hover:bg-zinc-100 cursor-pointer text-xs leading-none"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <textarea
          rows={2}
          maxLength={1000}
          autoFocus={autoFocus}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:outline-hidden resize-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 mt-1">
          <span className="text-[11px] text-zinc-400">
            {content.length}/1000
          </span>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

