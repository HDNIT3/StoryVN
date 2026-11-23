"use client";

import React, { useState, useEffect } from "react";
import type { AdminChapterItem } from "@/features/chapters";

export type ChapterActionType = "REJECT" | "UNPUBLISH" | "HIDE";

interface Props {
  isOpen: boolean;
  actionType: ChapterActionType | null;
  chapter: AdminChapterItem | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ChapterActionModal({
  isOpen,
  actionType,
  chapter,
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

  if (!isOpen || !actionType || !chapter) return null;

  const isUpdateReview = Boolean(
    chapter.isPendingRevisionReview ||
    (chapter.status === "PUBLISHED" && (chapter as any).pendingRevision?.status === "PENDING_REVIEW")
  );

  const chapterDisplay = `Chương ${chapter.chapterNumber}${
    chapter.title ? `: "${chapter.title}"` : ""
  }`;

  const config = {
    REJECT: {
      title: isUpdateReview ? "Từ chối bản chỉnh sửa chương truyện" : "Từ chối duyệt chương truyện",
      badgeColor: "bg-rose-100 text-rose-700",
      btnColor: "bg-rose-600 hover:bg-rose-700 text-white",
      btnText: "Xác nhận từ chối",
      requireReason: true,
      description: isUpdateReview
        ? `Vui lòng nhập lý do từ chối bản chỉnh sửa của ${chapterDisplay}. Độc giả vẫn tiếp tục đọc bản chính hiện tại, và tác giả sẽ nhận được thông báo để chỉnh sửa lại.`
        : `Vui lòng nhập lý do từ chối ${chapterDisplay}. Lý do này sẽ được thông báo ngay tới tác giả kèm thông tin cụ thể để sửa chữa.`,
      sampleReasons: [
        "Nội dung chương chứa ngôn từ thô tục, phản cảm hoặc quá nhạy cảm",
        "Độ dài chương quá ngắn, chưa đủ nội dung tiêu chuẩn",
        "Lỗi chính tả, định dạng hoặc văn bản bị vỡ/mất chữ quá nhiều",
        "Nội dung chương bị trùng lặp với chương đã đăng trước đó",
        "Có hành vi chèn liên kết spam, quảng cáo bên ngoài trái phép",
      ],
    },
    UNPUBLISH: {
      title: "Gỡ duyệt chương truyện",
      badgeColor: "bg-amber-100 text-amber-800",
      btnColor: "bg-amber-600 hover:bg-amber-700 text-white",
      btnText: "Xác nhận gỡ duyệt",
      requireReason: false,
      description: `${chapterDisplay} sẽ được chuyển từ trạng thái Đã xuất bản về Bản nháp. Độc giả sẽ không còn đọc được chương này cho tới khi tác giả cập nhật và được duyệt lại.`,
      sampleReasons: [
        "Chương nhận được báo cáo vi phạm nội dung đang chờ kiểm chứng",
        "Tác giả yêu cầu hỗ trợ rút tạm chương để chỉnh sửa cốt truyện",
        "Nội dung cần kiểm duyệt lại do khiếu nại bản quyền",
      ],
    },
    HIDE: {
      title: "Ẩn chương truyện",
      badgeColor: "bg-purple-100 text-purple-800",
      btnColor: "bg-purple-600 hover:bg-purple-700 text-white",
      btnText: "Xác nhận ẩn chương",
      requireReason: false,
      description: `${chapterDisplay} sẽ bị ẩn khỏi toàn bộ độc giả (chuyển sang trạng thái Đã ẩn). Bạn có thể mở lại hiển thị công khai bất cứ lúc nào.`,
      sampleReasons: [
        "Tạm ẩn chương để rà soát vi phạm tiêu chuẩn cộng đồng",
        "Có tranh chấp bản quyền hoặc khiếu nại từ độc giả",
        "Tác giả yêu cầu ẩn tạm thời",
      ],
    },
  }[actionType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.requireReason && !reason.trim()) {
      setError("Vui lòng nhập lý do từ chối cụ thể.");
      return;
    }
    setError("");
    await onSubmit(reason.trim());
  };

  return (
    <div className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-950/50 animate-in fade-in duration-200">
      <div className="admin-dialog bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="admin-dialog-header px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeColor}`}
            >
              {actionType === "REJECT" ? "Từ chối" : actionType === "HIDE" ? "Ẩn chương" : "Gỡ duyệt"}
            </span>
            <h3 className="admin-dialog-title text-base font-semibold text-gray-800">{config.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="admin-dialog-close p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="admin-dialog-form admin-dialog-body p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            {config.description}
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Lý do xử lý {config.requireReason ? <span className="text-rose-500">*</span> : "(Không bắt buộc)"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder={
                config.requireReason
                  ? "Ví dụ: Nội dung chương chứa nhiều từ ngữ nhạy cảm chưa phù hợp..."
                  : "Nhập lý do gửi đến tác giả (tùy chọn)..."
              }
              className={`w-full p-3 text-sm md:text-sm bg-gray-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-admin-brand-500/20 focus:border-admin-brand-500 transition-all text-gray-800 placeholder:text-gray-400 ${
                error ? "border-rose-400" : "border-gray-200"
              }`}
            />
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          {/* Gợi ý lý do nhanh */}
          <div>
            <span className="text-xs font-semibold text-gray-500 block mb-1.5">
              Gợi ý lý do mẫu:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {config.sampleReasons.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(sample);
                    if (error) setError("");
                  }}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-colors text-left cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="admin-dialog-footer pt-2 flex items-center justify-end gap-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-admin-card flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${config.btnColor}`}
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              )}
              <span>{config.btnText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

