"use client";

import React, { useState } from "react";
import { toast } from "@/lib/toast";
import { useSharePost } from "../queries/useForumQueries";

interface ForumShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    _id: string;
    title: string;
  };
  onShareSuccess?: (newCount?: number) => void;
}

export function ForumShareModal({
  isOpen,
  onClose,
  post,
  onShareSuccess,
}: ForumShareModalProps) {
  const shareMutation = useSharePost();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const postUrl = `${origin}/dien-dan/${post._id}`;

  const trackShare = () => {
    shareMutation.mutate(post._id, {
      onSuccess: (data) => {
        if (onShareSuccess) {
          onShareSuccess(data?.shareCount);
        }
      },
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm!");
      trackShare();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const handleShareFacebook = () => {
    trackShare();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleShareZalo = () => {
    trackShare();
    const zaloUrl = `https://sp.zalo.me/share_inline?url=${encodeURIComponent(postUrl)}`;
    window.open(zaloUrl, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const handleShareX = () => {
    trackShare();
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="min-w-0 pr-4">
            <h3 className="text-lg font-bold text-slate-900 truncate">Chia sẻ bài viết</h3>
            <p className="mt-0.5 text-xs text-slate-500 truncate">{post.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {/* Facebook */}
          <button
            type="button"
            onClick={handleShareFacebook}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:bg-blue-50/40 group shadow-2xs"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-slate-700">Facebook</span>
          </button>

          {/* Zalo */}
          <button
            type="button"
            onClick={handleShareZalo}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-400 hover:bg-sky-50/40 group shadow-2xs"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0068FF] text-white font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              Zalo
            </span>
            <span className="text-xs font-semibold text-slate-700">Zalo</span>
          </button>

          {/* X (Twitter) */}
          <button
            type="button"
            onClick={handleShareX}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:bg-slate-50 group shadow-2xs"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-slate-700">X (Twitter)</span>
          </button>
        </div>

        {/* Copy Link Input Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600">Hoặc sao chép liên kết</label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition">
            <input
              type="text"
              readOnly
              value={postUrl}
              className="w-full bg-transparent px-3 text-xs text-slate-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-sky-600 text-white hover:bg-sky-700 shadow-2xs"
              }`}
            >
              {copied ? "Đã chép ✓" : "Sao chép"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
