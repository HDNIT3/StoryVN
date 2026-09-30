"use client";

import React from "react";
import Image from "next/image";
import type { AuthorRequestItem, AuthorRequestStatus } from "@/types/author";

interface Props {
  items: AuthorRequestItem[];
  isLoading: boolean;
  onViewDetail: (request: AuthorRequestItem) => void;
  onOpenReview: (request: AuthorRequestItem, action: "APPROVED" | "REJECTED") => void;
}

const STATUS_BADGE_CONFIG: Record<
  AuthorRequestStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    label: string;
  }
> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Chờ duyệt",
  },
  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Đã duyệt",
  },
  REJECTED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    label: "Đã từ chối",
  },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function AuthorRequestTable({
  items,
  isLoading,
  onViewDetail,
  onOpenReview,
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải danh sách yêu cầu...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800">Không có yêu cầu nào</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Hiện tại không tìm thấy yêu cầu nâng cấp tác giả nào phù hợp với bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Người dùng</th>
              <th className="py-3.5 px-4">Bút danh đăng ký</th>
              <th className="py-3.5 px-4">Thông tin ngân hàng</th>
              <th className="py-3.5 px-4">Ngày gửi</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {items.map((req) => {
              const userInfo = typeof req.userId === "object" && req.userId !== null ? req.userId : null;
              const displayName = userInfo?.displayName || userInfo?.username || "Người dùng ẩn";
              const email = userInfo?.email || "-";
              const badge = STATUS_BADGE_CONFIG[req.status] || STATUS_BADGE_CONFIG.PENDING;

              return (
                <tr
                  key={req._id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Người dùng */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden border border-orange-200">
                        {userInfo?.avatarUrl ? (
                          <Image
                            src={userInfo.avatarUrl}
                            alt={displayName}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Bút danh đăng ký */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-orange-600">{req.penName}</div>
                    {req.reason && (
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                        {req.reason}
                      </p>
                    )}
                  </td>

                  {/* Thông tin ngân hàng */}
                  <td className="py-3.5 px-4">
                    {req.bankName ? (
                      <div className="text-xs space-y-0.5">
                        <p className="font-medium text-slate-800">{req.bankName}</p>
                        <p className="text-slate-500 font-mono">{req.bankAccountNumber || "-"}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>
                    )}
                  </td>

                  {/* Ngày gửi */}
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(req.createdAt)}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Xem chi tiết */}
                      <button
                        onClick={() => onViewDetail(req)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Xem chi tiết đơn"
                      >
                        Chi tiết
                      </button>

                      {/* Duyệt / Từ chối nếu đang PENDING */}
                      {req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => onOpenReview(req, "APPROVED")}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => onOpenReview(req, "REJECTED")}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
