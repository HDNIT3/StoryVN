"use client";

import React, { useState } from "react";
import type { StoryItem } from "@/types/story";
import { useAppealStory } from "@/lib/hooks/queries/useStoryQuery";

interface Props {
  open: boolean;
  story: StoryItem | null;
  onClose: () => void;
}

export function AuthorStoryAppealModal({ open, story, onClose }: Props) {
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const appealMutation = useAppealStory();

  if (!open || !story) return null;

  const storyId = story._id || story.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setErrorMsg("Vui lòng nhập nội dung phản hồi / giải trình.");
      return;
    }

    if (feedback.trim().length < 10) {
      setErrorMsg("Nội dung phản hồi cần tối thiểu 10 ký tự.");
      return;
    }

    if (!storyId) return;

    try {
      await appealMutation.mutateAsync({
        id: storyId,
        feedback: feedback.trim(),
      });
      setFeedback("");
      setErrorMsg("");
      onClose();
    } catch {
      // error handled in mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-linear-to-r from-amber-50/80 to-indigo-50/80">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
              💬
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Gửi phản hồi / Khiếu nại từ chối
              </h3>
              <p className="text-xs text-zinc-500">
                Giải trình với Ban quản trị nếu lý do từ chối chưa chính xác
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-white/80 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Thông tin tác phẩm & Lý do từ chối */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
            <div>
              <span className="text-zinc-400 block text-[11px]">Tác phẩm:</span>
              <strong className="text-zinc-900 font-bold text-sm block line-clamp-1">
                {story.title}
              </strong>
            </div>

            {story.rejectReason && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-0.5">
                <span className="font-bold text-rose-900 block text-[11px]">
                  Lý do Ban quản trị từ chối:
                </span>
                <p className="text-rose-700 leading-relaxed">
                  {story.rejectReason}
                </p>
              </div>
            )}
          </div>

          {/* Nếu đã từng gửi giải trình trước đó */}
          {story.authorFeedback && (
            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-indigo-900">
              <span className="font-bold block text-[11px] mb-0.5 text-indigo-800">
                Phản hồi trước đó của bạn:
              </span>
              <p className="italic text-zinc-700 leading-relaxed">
                "{story.authorFeedback}"
              </p>
            </div>
          )}

          {/* Form nhập giải trình mới */}
          <div className="space-y-1.5">
            <label className="block font-bold text-zinc-800">
              Nội dung giải trình / khiếu nại của bạn <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              rows={4}
              placeholder="VD: Em xin đính chính ảnh bìa là do em tự vẽ bản quyền đầy đủ, nội dung văn án không vi phạm quy định tiêu chuẩn cộng đồng... Nhờ Ban quản trị xem xét duyệt lại giúp em ạ."
              className="w-full p-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-800 placeholder-zinc-400 resize-none leading-relaxed text-xs"
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-600 font-medium">
                {errorMsg}
              </p>
            )}
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Sau khi gửi, tác phẩm sẽ tự động được chuyển lại vào hàng đợi <strong>Chờ kiểm duyệt</strong> của Ban quản trị kèm toàn bộ nội dung phản hồi này.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={appealMutation.isPending}
              className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={appealMutation.isPending}
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {appealMutation.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Gửi phản hồi giải trình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
