"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authorRequestService, AuthorRequestItem, AuthorRequestStatus } from "@/lib/services/author-request.service";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";

const STATUS_LABEL: Record<AuthorRequestStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const STATUS_STYLE: Record<AuthorRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_DOT: Record<AuthorRequestStatus, string> = {
  PENDING: "bg-yellow-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
};

type FilterStatus = AuthorRequestStatus | "ALL";

interface ReviewModalState {
  open: boolean;
  request: AuthorRequestItem | null;
  action: "APPROVED" | "REJECTED" | null;
  adminNote: string;
  isLoading: boolean;
}

export default function DuyetTacGiaPage() {
  const [items, setItems] = useState<AuthorRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [modal, setModal] = useState<ReviewModalState>({
    open: false,
    request: null,
    action: null,
    adminNote: "",
    isLoading: false,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (filter !== "ALL") params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await authorRequestService.findAllRequests(params);
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.totalItems);
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải danh sách yêu cầu");
    } finally {
      setIsLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openReviewModal = (request: AuthorRequestItem, action: "APPROVED" | "REJECTED") => {
    setModal({ open: true, request, action, adminNote: "", isLoading: false });
  };

  const closeModal = () => {
    setModal({ open: false, request: null, action: null, adminNote: "", isLoading: false });
  };

  const handleReview = async () => {
    if (!modal.request || !modal.action) return;
    setModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await authorRequestService.reviewRequest(
        (modal.request as any)._id,
        {
          status: modal.action,
          adminNote: modal.adminNote.trim() || undefined,
        }
      );
      toast.success(res.message || "Xử lý thành công");
      closeModal();
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Xử lý thất bại");
      setModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getUserInfo = (req: AuthorRequestItem) => {
    if (typeof req.userId === "object" && req.userId !== null) {
      return req.userId;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Duyệt yêu cầu nâng cấp Tác giả</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Xét duyệt các yêu cầu từ người dùng muốn trở thành tác giả trên StoryVN
          </p>
        </div>
        <Button
          id="btn-refresh-requests"
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
          leftIcon={
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          Làm mới
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(["PENDING", "APPROVED", "REJECTED"] as AuthorRequestStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl p-4 border text-left transition-all ${
              filter === s
                ? "bg-slate-700 border-slate-600"
                : "bg-slate-800/60 border-slate-800 hover:bg-slate-800"
            }`}
          >
            <div className={`flex items-center gap-2 mb-1`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              <span className="text-xs text-slate-400">{STATUS_LABEL[s]}</span>
            </div>
            <p className="text-2xl font-bold text-white">—</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === s
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto relative">
          <input
            type="text"
            placeholder="Tìm bút danh, tên tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-700 text-slate-100 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 pl-9 border border-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400 text-sm">Không có yêu cầu nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Người dùng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bút danh</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Ngân hàng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Ngày gửi</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((req) => {
                  const userInfo = getUserInfo(req);
                  const reqId = (req as any)._id as string;
                  return (
                    <tr key={reqId} className="hover:bg-slate-700/30 transition-colors">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-white text-sm">
                            {userInfo ? userInfo.displayName : "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {userInfo ? `@${userInfo.username}` : typeof req.userId === "string" ? req.userId : ""}
                          </p>
                        </div>
                      </td>
                      {/* Bút danh */}
                      <td className="px-5 py-4 text-slate-200 font-medium">{req.penName}</td>
                      {/* Ngân hàng */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {req.bankName ? (
                          <div className="text-xs text-slate-300">
                            <p>{req.bankName}</p>
                            <p className="text-slate-500 font-mono">{req.bankAccountNumber || "—"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">Chưa có</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            STATUS_STYLE[req.status]
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[req.status]}`} />
                          {STATUS_LABEL[req.status]}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-slate-400 hidden md:table-cell">
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {req.status === "PENDING" ? (
                            <>
                              <button
                                id={`btn-approve-${reqId}`}
                                onClick={() => openReviewModal(req, "APPROVED")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Duyệt
                              </button>
                              <button
                                id={`btn-reject-${reqId}`}
                                onClick={() => openReviewModal(req, "REJECTED")}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors"
                              >
                                Từ chối
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">Đã xử lý</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Tổng {totalItems} yêu cầu</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Trước
              </button>
              <span className="font-medium text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Review Modal ─── */}
      {modal.open && modal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          {/* Dialog */}
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {modal.action === "APPROVED" ? "✅ Xác nhận duyệt" : "❌ Xác nhận từ chối"}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Request info */}
            <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Người dùng</span>
                <span className="text-white font-medium">
                  {typeof modal.request.userId === "object"
                    ? modal.request.userId.displayName
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bút danh</span>
                <span className="text-white font-medium">{modal.request.penName}</span>
              </div>
              {modal.request.reason && (
                <div>
                  <p className="text-slate-400 mb-1">Lý do gửi yêu cầu</p>
                  <p className="text-slate-300 text-xs bg-slate-800 rounded-lg p-2">{modal.request.reason}</p>
                </div>
              )}
            </div>

            {/* Admin note */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Ghi chú ({modal.action === "REJECTED" ? "bắt buộc nếu từ chối" : "tùy chọn"})
              </label>
              <textarea
                id="input-admin-note"
                value={modal.adminNote}
                onChange={(e) => setModal((prev) => ({ ...prev, adminNote: e.target.value }))}
                rows={3}
                placeholder={
                  modal.action === "APPROVED"
                    ? "Chào mừng bạn trở thành tác giả của StoryVN!"
                    : "Lý do từ chối yêu cầu..."
                }
                className="w-full bg-slate-900 text-slate-100 placeholder:text-slate-600 text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 px-3 py-2.5 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                id="btn-modal-cancel"
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="flex-1 border border-slate-700 text-slate-300"
              >
                Hủy
              </Button>
              <button
                id="btn-modal-confirm"
                onClick={handleReview}
                disabled={modal.isLoading}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  modal.action === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                {modal.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : modal.action === "APPROVED" ? (
                  "Xác nhận duyệt"
                ) : (
                  "Xác nhận từ chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
