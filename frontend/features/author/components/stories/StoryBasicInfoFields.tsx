"use client";

import React from "react";
import { StoryAgeRating, StoryProgressState } from "@/features/stories";

interface StoryBasicInfoFieldsProps {
  title: string;
  slug: string;
  description: string;
  progressState: StoryProgressState;
  ageRating: StoryAgeRating;
  authorNote: string;
  onTitleChange: (val: string) => void;
  onSlugChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onProgressStateChange: (val: StoryProgressState) => void;
  onAgeRatingChange: (val: StoryAgeRating) => void;
  onAuthorNoteChange: (val: string) => void;
}

export function StoryBasicInfoFields({
  title,
  slug,
  description,
  progressState,
  ageRating,
  authorNote,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
  onProgressStateChange,
  onAgeRatingChange,
  onAuthorNoteChange,
}: StoryBasicInfoFieldsProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
      <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
        Thông tin tác phẩm
      </h2>

      {/* Tên truyện & Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            Tên tác phẩm <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="VD: Vạn Cổ Đệ Nhất Thần"
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            Đường dẫn (Slug URL)
          </label>
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-3 focus-within:ring-1 focus-within:ring-sky-500 focus-within:border-sky-500">
            <span className="text-sm text-zinc-400 font-mono select-none">/truyen/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="van-co-de-nhat-than"
              className="w-full py-2.5 pl-1.5 pr-2 bg-transparent text-sm text-zinc-900 font-mono focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Tóm tắt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-zinc-800">
            Tóm tắt cốt truyện
          </label>
          <span className="text-xs text-zinc-400 font-medium">{description.length} ký tự</span>
        </div>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Giới thiệu nội dung, bối cảnh và điểm hấp dẫn của tác phẩm..."
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 resize-none leading-relaxed"
        />
      </div>

      {/* Tiến độ sáng tác & Độ tuổi độc giả */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            Tình trạng tiến độ
          </label>
          <select
            value={progressState}
            onChange={(e) => onProgressStateChange(e.target.value as StoryProgressState)}
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="ONGOING">Đang ra (Đang cập nhật chương)</option>
            <option value="COMPLETED">Đã hoàn thành (Trọn bộ)</option>
            <option value="ON_HOLD">Tạm ngưng ra chương</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
            Độ tuổi độc giả
          </label>
          <select
            value={ageRating}
            onChange={(e) => onAgeRatingChange(e.target.value as StoryAgeRating)}
            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">Mọi lứa tuổi (ALL)</option>
            <option value="13+">13+ (Thiếu niên)</option>
            <option value="16+">16+ (Trưởng thành nhẹ)</option>
            <option value="18+">18+ (Cảnh báo nhạy cảm)</option>
          </select>
        </div>
      </div>

      {/* Lời ngỏ tác giả / Lịch ra chương */}
      <div>
        <label className="block text-sm font-semibold text-zinc-800 mb-1.5">
          Lời ngỏ tác giả / Lịch ra chương
        </label>
        <input
          type="text"
          value={authorNote}
          onChange={(e) => onAuthorNoteChange(e.target.value)}
          placeholder="VD: Cố định 2 chương/ngày lúc 20:00..."
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>
    </div>
  );
}
