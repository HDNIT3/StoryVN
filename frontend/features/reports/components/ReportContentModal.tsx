"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useLoginHref } from "@/lib/hooks/useLoginHref";
import { Button } from "@/components/ui/Button";
import { useSubmitReport } from "../queries/useReportQueries";
import type { ReportTargetType } from "../services/report.service";

export interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS_BY_TYPE: Record<ReportTargetType, { id: string; label: string; desc: string }[]> = {
  FORUM_POST: [
    { id: "spam", label: "Spam, quảng cáo hoặc dẫn link độc hại", desc: "Đăng lặp lại nhiều lần, quảng cáo trái phép, lừa đảo" },
    { id: "hate", label: "Ngôn từ đả kích, xúc phạm, gây thù ghét", desc: "Công kích cá nhân, kỳ thị, chửi bới thô tục" },
    { id: "nsfw", label: "Nội dung đồi trụy, 18+ vượt quá giới hạn", desc: "Hình ảnh hoặc ngôn từ nhạy cảm không phù hợp thuần phong mỹ tục" },
    { id: "spoiler", label: "Tiết lộ tình tiết truyện (Spoiler) không cảnh báo", desc: "Cố tình spoil nội dung quan trọng gây ảnh hưởng trải nghiệm đọc" },
    { id: "copyright", label: "Vi phạm bản quyền / Đạo văn", desc: "Sao chép trái phép bài viết hoặc tác phẩm của người khác" },
    { id: "other", label: "Lý do vi phạm khác", desc: "Mô tả cụ thể vấn đề vi phạm bên dưới" },
  ],
  STORY: [
    { id: "copyright", label: "Vi phạm bản quyền / Đăng lậu (Reup)", desc: "Truyện sao chép chưa có sự đồng ý của tác giả / dịch giả" },
    { id: "nsfw", label: "Nội dung đồi trụy, bạo lực hoặc vi phạm pháp luật", desc: "Nội dung cấm, chống phá, 18+ nặng chưa gắn nhãn" },
    { id: "spam", label: "Truyện rác, spam hoặc nội dung trống", desc: "Đăng truyện giả mạo, câu view, quảng cáo" },
    { id: "wrong_info", label: "Sai thông tin thể loại, cảnh báo độ tuổi", desc: "Gắn sai tag gây hiểu nhầm nghiêm trọng cho độc giả" },
    { id: "other", label: "Lý do vi phạm khác", desc: "Mô tả cụ thể vấn đề vi phạm bên dưới" },
  ],
  CHAPTER: [
    { id: "error", label: "Nội dung chương bị lỗi, thiếu chữ hoặc乱 mã", desc: "Chương bị lặp đoạn, mất chữ, lỗi hiển thị hoặc nhầm chương" },
    { id: "nsfw", label: "Nội dung không phù hợp / Vi phạm quy tắc cộng đồng", desc: "Ngôn từ nhạy cảm, vi phạm thuần phong mỹ tục" },
    { id: "scam", label: "Gian lận khóa chương trả phí (Xu)", desc: "Chương trả phí nhưng nội dung rỗng, rác hoặc đánh lừa độc giả" },
    { id: "copyright", label: "Sao chép bản dịch / Đạo văn", desc: "Nội dung chương lấy cắp từ nguồn bản quyền khác" },
    { id: "other", label: "Lý do vi phạm khác", desc: "Mô tả cụ thể vấn đề vi phạm bên dưới" },
  ],
  COMMENT: [
    { id: "hate", label: "Ngôn từ xúc phạm, công kích cá nhân / tác giả", desc: "Chửi bới, miệt thị, gây war trong phần thảo luận" },
    { id: "spam", label: "Spam bình luận, quảng cáo, rải link", desc: "Bình luận rác lặp đi lặp lại hoặc chèn link lạ" },
    { id: "spoiler", label: "Cố tình tiết lộ tình tiết (Spoiler)", desc: "Spoil diễn biến các chương sau làm hỏng trải nghiệm người đọc" },
    { id: "nsfw", label: "Nội dung thô tục, nhạy cảm, quấy rối", desc: "Bình luận khiếm nhã, vi phạm tiêu chuẩn văn minh" },
    { id: "other", label: "Lý do vi phạm khác", desc: "Mô tả cụ thể vấn đề vi phạm bên dưới" },
  ],
};

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  FORUM_POST: "bài viết diễn đàn",
  STORY: "tác phẩm truyện",
  CHAPTER: "chương truyện",
  COMMENT: "bình luận",
};

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { isAuthenticated } = useAuth();
  const loginHref = useLoginHref();
  const submitReport = useSubmitReport();

  const reasons = REPORT_REASONS_BY_TYPE[targetType] || REPORT_REASONS_BY_TYPE.FORUM_POST;
  const [selectedCategory, setSelectedCategory] = useState<string>(reasons[0]?.id || "other");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(reasons[0]?.id || "other");
      setDetails("");
    }
  }, [isOpen, targetType]);

  if (!isOpen) return null;

  const selectedReasonObj = reasons.find((r) => r.id === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return;

    const categoryLabel = selectedReasonObj ? `[${selectedReasonObj.label}]` : "[Báo cáo vi phạm]";
    const trimmedDetails = details.trim();
    const finalReason = trimmedDetails
      ? `${categoryLabel} ${trimmedDetails}`
      : categoryLabel;

    submitReport.mutate(
      {
        targetType,
        targetId,
        reason: finalReason.slice(0, 1000),
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-rose-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Báo cáo vi phạm {TARGET_TYPE_LABELS[targetType]}
              </h3>
              {targetTitle && (
                <p className="text-xs text-slate-500 line-clamp-1 max-w-xs sm:max-w-sm">
                  Nội dung: <span className="font-semibold text-slate-700">{targetTitle}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Đóng"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {!isAuthenticated ? (
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-slate-600">
              Vui lòng đăng nhập tài khoản để gửi báo cáo vi phạm tới Ban quản trị StoryVN.
            </p>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Chọn phân loại vi phạm
              </label>
              <div className="space-y-2">
                {reasons.map((item) => {
                  const active = selectedCategory === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                        active
                          ? "border-rose-300 bg-rose-50/60 ring-1 ring-rose-200"
                          : "border-slate-200/80 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportCategory"
                        value={item.id}
                        checked={active}
                        onChange={() => setSelectedCategory(item.id)}
                        className="mt-1 h-4 w-4 accent-rose-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs sm:text-sm font-bold ${active ? "text-rose-900" : "text-slate-800"}`}>
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Mô tả chi tiết {selectedCategory === "other" ? "(Bắt buộc)" : "(Tùy chọn)"}
              </label>
              <textarea
                rows={3}
                maxLength={800}
                required={selectedCategory === "other"}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Cung cấp thêm bằng chứng, đoạn văn vi phạm hoặc thông tin cụ thể để Ban quản trị xử lý nhanh hơn..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>Báo cáo của bạn được bảo mật danh tính hoàn toàn.</span>
                <span>{details.length}/800</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={submitReport.isPending}
                disabled={
                  submitReport.isPending ||
                  (selectedCategory === "other" && !details.trim())
                }
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Gửi báo cáo vi phạm
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
