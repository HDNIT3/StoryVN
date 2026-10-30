import React from "react";
import { ChapterRevisionItem, ChapterStatus } from "@/features/chapters";

interface StatusBadgeProps {
  status: ChapterStatus;
  rejectReason?: string | null;
  pendingRevision?: ChapterRevisionItem | null;
}

export function StatusBadge({
  status,
  rejectReason,
  pendingRevision,
}: StatusBadgeProps) {
  return (
    <div className="flex flex-col gap-1 items-start">
      {status === "PUBLISHED" && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đã xuất bản
        </span>
      )}
      {status === "PENDING_REVIEW" && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Chờ duyệt
        </span>
      )}
      {status === "REJECTED" && (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
          title={rejectReason ? `Lý do từ chối: ${rejectReason}` : "Bị từ chối"}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Bị từ chối
        </span>
      )}
      {status === "HIDDEN" && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Đã ẩn
        </span>
      )}
      {status === "DRAFT" && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Bản nháp
        </span>
      )}
      {status === "PUBLISHED" && pendingRevision && (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${
            pendingRevision.status === "PENDING_REVIEW"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : pendingRevision.status === "REJECTED"
              ? "bg-rose-50 text-rose-700 border-rose-200 cursor-help"
              : "bg-zinc-50 text-zinc-600 border-zinc-200"
          }`}
          title={pendingRevision.rejectReason ? `Lý do từ chối bản sửa: ${pendingRevision.rejectReason}` : undefined}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {pendingRevision.status === "PENDING_REVIEW"
            ? "Bản sửa chờ duyệt"
            : pendingRevision.status === "REJECTED"
            ? "Bản sửa bị từ chối"
            : "Có bản sửa nháp"}
        </span>
      )}
    </div>
  );
}
