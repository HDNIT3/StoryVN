"use client";

import React from "react";
import { StoryVisibility } from "@/features/stories";

interface StoryPublishSettingsProps {
  visibility: StoryVisibility;
  isSubmitting: boolean;
  isUploadingImage: boolean;
  isPendingMutation: boolean;
  onVisibilityChange: (v: StoryVisibility) => void;
  onSubmit: (action: "DRAFT" | "SUBMIT") => void;
}

export function StoryPublishSettings({
  visibility,
  isSubmitting,
  isUploadingImage,
  isPendingMutation,
  onVisibilityChange,
  onSubmit,
}: StoryPublishSettingsProps) {
  const isBusy = isSubmitting || isPendingMutation;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
      <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
        Chế độ hiển thị
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onVisibilityChange("PUBLIC")}
          className={`p-3 rounded-lg border text-left transition cursor-pointer ${
            visibility === "PUBLIC"
              ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
              : "border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <div className="text-sm font-bold text-zinc-900">Công khai</div>
          <div className="text-xs text-zinc-500 mt-0.5">Hiển thị cho độc giả</div>
        </button>

        <button
          type="button"
          onClick={() => onVisibilityChange("PRIVATE")}
          className={`p-3 rounded-lg border text-left transition cursor-pointer ${
            visibility === "PRIVATE"
              ? "border-sky-500 bg-sky-50/50 ring-1 ring-sky-500"
              : "border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <div className="text-sm font-bold text-zinc-900">Riêng tư</div>
          <div className="text-xs text-zinc-500 mt-0.5">Chỉ bạn xem được</div>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-zinc-100 space-y-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onSubmit("SUBMIT")}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {isBusy ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{isUploadingImage ? "Đang tải ảnh..." : "Đang xử lý..."}</span>
            </>
          ) : (
            <span>Gửi xét duyệt tác phẩm</span>
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onSubmit("DRAFT")}
          className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
        >
          Lưu bản nháp
        </button>
      </div>
    </div>
  );
}
