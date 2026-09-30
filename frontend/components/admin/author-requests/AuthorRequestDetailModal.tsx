"use client";

import React from "react";
import Image from "next/image";
import type { AuthorRequestItem } from "@/types/author";

interface Props {
  request: AuthorRequestItem | null;
  onClose: () => void;
  onOpenReview: (request: AuthorRequestItem, action: "APPROVED" | "REJECTED") => void;
}

function formatDate(dateStr?: string | null) {
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

export function AuthorRequestDetailModal({
  request,
  onClose,
  onOpenReview,
}: Props) {
  if (!request) return null;

  const userInfo = typeof request.userId === "object" && request.userId !== null ? request.userId : null;
  const displayName = userInfo?.displayName || userInfo?.username || "Người dùng";
  const email = userInfo?.email || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Chi tiết đơn đăng ký tác giả</h3>
            <p className="text-xs text-slate-500 mt-0.5">Mã đơn: {request._id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Thông tin tài khoản người dùng */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 text-base overflow-hidden border border-orange-200">
              {userInfo?.avatarUrl ? (
                <Image
                  src={userInfo.avatarUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 truncate">{displayName}</p>
                <span className="text-[10px] font-semibold uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {userInfo?.role || "USER"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{email}</p>
            </div>
          </div>

          {/* Thông tin tác giả đăng ký */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bút danh đăng ký</span>
              <p className="font-bold text-orange-600 text-base">{request.penName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái đơn</span>
              <p className="font-semibold text-slate-800">
                {request.status === "PENDING" && <span className="text-amber-600">⏳ Chờ xét duyệt</span>}
                {request.status === "APPROVED" && <span className="text-emerald-600">✅ Đã phê duyệt</span>}
                {request.status === "REJECTED" && <span className="text-rose-600">❌ Đã từ chối</span>}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiểu sử tác giả</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-xs">
                {request.biography || "Chưa cập nhật tiểu sử."}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lý do muốn làm tác giả</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-xs">
                {request.reason || "Không có lý do ghi chú."}
              </p>
            </div>

            {request.website && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Website / Blog cá nhân</span>
                <p className="text-blue-600 truncate text-xs">
                  <a href={request.website} target="_blank" rel="noreferrer" className="hover:underline">
                    {request.website}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Thông tin ngân hàng nhận thù lao */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Thông tin thanh toán / Ngân hàng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Tên ngân hàng</span>
                <span className="font-semibold text-slate-800">{request.bankName || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Số tài khoản</span>
                <span className="font-semibold text-slate-800 font-mono">{request.bankAccountNumber || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Chủ tài khoản</span>
                <span className="font-semibold text-slate-800">{request.bankAccountName || "-"}</span>
              </div>
            </div>
          </div>

          {/* Thông tin xét duyệt (nếu đã xử lý) */}
          {request.status !== "PENDING" && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lịch sử xét duyệt
              </h4>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian xử lý:</span>
                  <span className="font-medium text-slate-700">{formatDate(request.processedAt)}</span>
                </div>
                {request.adminNote && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block mb-1">Ghi chú từ Ban quản trị:</span>
                    <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      &quot;{request.adminNote}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>

          {request.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(request, "REJECTED");
                }}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              >
                Từ chối
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(request, "APPROVED");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
              >
                Phê duyệt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
