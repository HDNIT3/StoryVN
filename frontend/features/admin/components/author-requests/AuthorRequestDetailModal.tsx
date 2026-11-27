"use client";

import React from "react";
import Image from "next/image";
import type { AuthorRequestItem } from "@/features/author";

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
  const displayName = userInfo?.displayName || "Người dùng";
  const email = userInfo?.email || "-";

  return (
    <div className="admin-dialog-overlay fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-gray-950/50 animate-in fade-in duration-200">
      <div className="admin-dialog bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="admin-dialog-header flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="admin-dialog-title text-xl font-semibold text-gray-900">Chi tiết đơn đăng ký tác giả</h3>
            <p className="text-xs sm:text-xs text-gray-500 mt-0.5 truncate max-w-[220px] sm:max-w-none">Mã đơn: {request._id}</p>
          </div>
          <button
            onClick={onClose}
            className="admin-dialog-close text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-dialog-body p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-sm text-gray-700">
          {/* Thông tin tài khoản người dùng */}
          <div className="bg-gray-50 rounded-xl p-3.5 sm:p-4 border border-gray-100 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-admin-brand-100 text-admin-brand-700 font-medium flex items-center justify-center shrink-0 text-sm sm:text-base overflow-hidden border border-admin-brand-200">
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
                <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{displayName}</p>
                <span className="text-xs font-semibold uppercase bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                  {userInfo?.role || "USER"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{email}</p>
            </div>
          </div>

          {/* Thông tin tác giả đăng ký */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bút danh đăng ký</span>
              <p className="font-medium text-admin-brand-600 text-base">{request.penName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái đơn</span>
              <p className="font-semibold text-gray-800">
                {request.status === "PENDING" && <span className="text-amber-600">⏳ Chờ xét duyệt</span>}
                {request.status === "APPROVED" && <span className="text-emerald-600">✅ Đã phê duyệt</span>}
                {request.status === "REJECTED" && <span className="text-rose-600">❌ Đã từ chối</span>}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tiểu sử tác giả</span>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed text-xs">
                {request.biography || "Chưa cập nhật tiểu sử."}
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lý do muốn làm tác giả</span>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed text-xs">
                {request.reason || "Không có lý do ghi chú."}
              </p>
            </div>

            {request.website && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Website / Blog cá nhân</span>
                <p className="text-blue-600 truncate text-xs">
                  <a href={request.website} target="_blank" rel="noreferrer" className="hover:underline">
                    {request.website}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Thông tin ngân hàng nhận thù lao */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3">
              Thông tin thanh toán / Ngân hàng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Tên ngân hàng</span>
                <span className="font-semibold text-gray-800">{request.bankName || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Số tài khoản</span>
                <span className="font-semibold text-gray-800 font-mono">{request.bankAccountNumber || "-"}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Chủ tài khoản</span>
                <span className="font-semibold text-gray-800">{request.bankAccountName || "-"}</span>
              </div>
            </div>
          </div>

          {/* Thông tin xét duyệt (nếu đã xử lý) */}
          {request.status !== "PENDING" && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Lịch sử xét duyệt
              </h4>
              <div className="bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Thời gian xử lý:</span>
                  <span className="font-medium text-gray-700">{formatDate(request.processedAt)}</span>
                </div>
                {request.adminNote && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-400 block mb-1">Ghi chú từ Ban quản trị:</span>
                    <p className="text-gray-800 italic bg-white p-2.5 rounded-lg border border-gray-200">
                      &quot;{request.adminNote}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="admin-dialog-footer px-4 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                className="px-3.5 sm:px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Từ chối
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(request, "APPROVED");
                }}
                className="px-3.5 sm:px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-admin-card transition-colors cursor-pointer"
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

