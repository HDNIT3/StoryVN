"use client";

import React, { useState, useEffect } from "react";
import type { AdminStoryItem } from "@/features/stories";

export type StoryActionType = "REJECT" | "UNPUBLISH" | "HIDE";

interface Props {
  isOpen: boolean;
  actionType: StoryActionType | null;
  story: AdminStoryItem | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function StoryActionModal({
  isOpen,
  actionType,
  story,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !actionType || !story) return null;

  const config = {
    REJECT: {
      title: "Từ chối phê duyệt tác phẩm",
      badgeColor: "bg-rose-100 text-rose-700",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
      btnText: "Xác nhận từ chối",
      requireReason: true,
      description: `Vui lòng nhập lý do từ chối tác phẩm "${story.title}". Lý do này sẽ được gửi thông báo trực tiếp tới tác giả để họ chỉnh sửa.`,
      sampleReasons: [
        "Ảnh bìa vi phạm bản quyền hoặc chứa hình ảnh nhạy cảm",
        "Nội dung mô tả giới thiệu có từ ngữ thô tục / không phù hợp",
        "Tác phẩm thiếu thông tin tóm tắt và thể loại chính xác",
        "Nội dung nghi vấn sao chép / chưa được tác giả gốc cấp phép",
      ],
    },
    UNPUBLISH: {
      title: "Gỡ duyệt tác phẩm",
      badgeColor: "bg-amber-100 text-amber-800",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
      btnText: "Xác nhận gỡ duyệt",
      requireReason: false,
      description: `Tác phẩm "${story.title}" sẽ được chuyển từ Đã xuất bản về Bản nháp. Độc giả sẽ không còn đọc được truyện này cho tới khi được duyệt lại.`,
      sampleReasons: [
        "Tác phẩm có báo cáo vi phạm bản quyền đang chờ xác minh",
        "Cần tác giả cập nhật lại thông tin nội dung chương",
        "Tạm ngưng xuất bản theo yêu cầu kiểm tra nội dung",
      ],
    },
    HIDE: {
      title: "Cấm / Ẩn tác phẩm công khai",
      badgeColor: "bg-purple-100 text-purple-700",
      btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
      btnText: "Xác nhận ẩn công khai",
      requireReason: false,
      description: `Tác phẩm "${story.title}" sẽ được chuyển sang chế độ Riêng tư (Private), bị ẩn khỏi trang chủ và kết quả tìm kiếm.`,
      sampleReasons: [
        "Nội dung có yếu tố nhạy cảm vi phạm quy chuẩn cộng đồng",
        "Tác phẩm bị người đọc khiếu nại nhiều lần",
        "Tạm thời cấm hiển thị công khai để điều tra tranh chấp",
      ],
    },
  }[actionType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.requireReason && !reason.trim()) {
      setError("Vui lòng nhập lý do cụ thể để tác giả nắm rõ thông tin");
      return;
    }

    try {
      await onSubmit(reason.trim());
      onClose();
    } catch {
      // error handled in mutation
    }
  };

  return (
    <div className="admin-dialog-overlay fixed inset-0 z-[70] overflow-y-auto bg-gray-950/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="admin-dialog bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="admin-dialog-header px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {config.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="admin-dialog-close p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="admin-dialog-form admin-dialog-body p-6 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {config.description}
          </p>

          {/* Gợi ý lý do mẫu */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Gợi ý lý do nhanh (bấm để điền):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.sampleReasons.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(sample);
                    setError("");
                  }}
                  className="text-left text-sm bg-gray-100 hover:bg-gray-200/80 text-gray-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea nhập lý do */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
              Lý do ghi chú {config.requireReason ? <span className="text-rose-500">*</span> : "(không bắt buộc)"}
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="Nhập lý do gửi đến tác giả..."
              className={`w-full p-3 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:bg-white focus:ring-2 transition-all text-gray-800 placeholder-gray-400 ${
                error
                  ? "border-rose-400 focus:ring-rose-100"
                  : "border-gray-200 focus:border-admin-brand-500 focus:ring-admin-brand-100"
              }`}
            />
            {error && (
              <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="admin-dialog-footer pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-medium rounded-lg shadow-admin-card transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${config.btnColor}`}
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {config.btnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

