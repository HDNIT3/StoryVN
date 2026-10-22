import React from "react";
import { ChapterUpdateItem } from "@/features/chapters";

interface ChapterHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterNumber: number;
  sortedHistory: ChapterUpdateItem[];
  isLoading: boolean;
  selectedRevision: ChapterUpdateItem | null;
  onSelectRevision: (rev: ChapterUpdateItem) => void;
  onLoadVersion: (rev: ChapterUpdateItem) => void;
}

export function ChapterHistoryModal({
  isOpen,
  onClose,
  chapterNumber,
  sortedHistory,
  isLoading,
  selectedRevision,
  onSelectRevision,
  onLoadVersion,
}: ChapterHistoryModalProps) {
  if (!isOpen) return null;

  const statusStyles: Record<string, string> = {
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-300",
    PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-300",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-300",
    DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const statusLabels: Record<string, string> = {
    APPROVED: "Đã duyệt",
    PUBLISHED: "Đã duyệt",
    PENDING_REVIEW: "Chờ duyệt",
    REJECTED: "Bị từ chối",
    DRAFT: "Bản nháp",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-5xl w-full h-[88vh] flex flex-col border border-slate-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Lịch sử chỉnh sửa Chương #{chapterNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                Bấm vào từng bản sửa để xem chi tiết đầy đủ nội dung hoặc nạp vào trình soạn thảo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body: Two-panel layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Column: Danh sách các bản sửa */}
          <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
            <div className="p-3 border-b border-slate-200/80 text-xs font-bold text-slate-600 bg-slate-100/70">
              Danh sách bản sửa ({sortedHistory.length})
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {isLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-medium">Đang tải...</p>
                </div>
              ) : sortedHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs px-3">
                  Chưa có bản ghi chỉnh sửa nào cho chương này.
                </div>
              ) : (
                sortedHistory.map((rev, idx) => {
                  const isSelected = selectedRevision?._id === rev._id;

                  return (
                    <div
                      key={rev._id}
                      onClick={() => onSelectRevision(rev)}
                      className={`p-3 rounded-md border text-left cursor-pointer transition select-none ${
                        isSelected
                          ? "bg-sky-50/90 border-sky-500 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-700">
                          Bản #{sortedHistory.length - idx}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                            statusStyles[rev.status] || statusStyles.DRAFT
                          }`}
                        >
                          {statusLabels[rev.status] || rev.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 truncate mb-1">
                        {rev.title || "(Chưa có tiêu đề)"}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Xem chi tiết */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedRevision ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white shrink-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {selectedRevision.title || "(Chưa có tiêu đề)"}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>
                          Thời gian gửi:{" "}
                          <strong>
                            {selectedRevision.createdAt
                              ? new Date(selectedRevision.createdAt).toLocaleString("vi-VN")
                              : "Không rõ"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Cấu hình:{" "}
                          <strong>
                            {selectedRevision.isFree ? "Miễn phí" : `Trả phí (${selectedRevision.coinPrice} xu)`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLoadVersion(selectedRevision)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Nạp vào trình soạn thảo</span>
                    </button>
                  </div>

                  {selectedRevision.rejectReason && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
                      <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <strong>Lý do từ chối từ Ban quản trị:</strong> {selectedRevision.rejectReason}
                      </div>
                    </div>
                  )}

                  {selectedRevision.reviewedAt && (
                    <div className="text-[11px] text-slate-500">
                      Kiểm duyệt lúc:{" "}
                      <span className="font-semibold text-slate-700">
                        {new Date(selectedRevision.reviewedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-800 text-sm leading-relaxed prose max-w-none select-text">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Nội dung chi tiết của bản ghi:
                  </div>
                  {selectedRevision.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      className="space-y-3 [&_p]:mb-3"
                    />
                  ) : (
                    <div className="text-slate-400 italic text-xs">Bản ghi này không có nội dung văn bản.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                Vui lòng chọn một bản ghi ở danh sách bên trái để xem chi tiết.
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
