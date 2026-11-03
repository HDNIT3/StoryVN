"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { paymentService, type TransactionDetail } from "@/features/payments";
import { toast } from "@/lib/toast";

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") || searchParams.get("vnp_TxnRef") || "";

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyOrderCode = () => {
    if (!transaction?.orderCode) return;
    navigator.clipboard.writeText(transaction.orderCode);
    setCopied(true);
    toast.info("Đã sao chép mã đơn hàng!");
    setTimeout(() => setCopied(false), 2000);
  };

  const loadTransaction = useCallback(
    async (showToast = false) => {
      if (!orderCode) {
        setIsLoading(false);
        setErrorMsg("Không tìm thấy mã đơn hàng cần kiểm tra");
        return;
      }

      try {
        if (showToast) setIsRefreshing(true);

        // Gom toàn bộ tham số VNPay (nếu có) để Backend xác thực chữ ký tức thì
        const queryParams: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          queryParams[key] = val;
        });

        const res = await paymentService.getTransactionByOrderCode(orderCode, queryParams);
        if (res.data) {
          setTransaction(res.data);
          setErrorMsg(null);
          if (showToast) {
            if (res.data.status === "SUCCESS") {
              toast.success("Giao dịch đã được xác nhận thành công!");
            } else if (res.data.status === "FAILED") {
              toast.error("Giao dịch thất bại!");
            } else {
              toast.info("Giao dịch đang được xử lý");
            }
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Không thể tải thông tin giao dịch từ máy chủ");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderCode, searchParams]
  );

  useEffect(() => {
    loadTransaction(false);
  }, [loadTransaction]);

  // Loading ban đầu: Hiệu ứng xoay tròn xanh hiện đại giống các web thanh toán
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 max-w-xl w-full text-center space-y-5">
          {/* Dual-tone blue spinner */}
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-blue-100/60 animate-ping opacity-30" />
            <div className="w-20 h-20 rounded-full border-[3.5px] border-blue-100 border-t-blue-600 border-r-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800">Đang đối soát thông tin thanh toán...</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Hệ thống đang kết nối và kiểm tra giao dịch với cổng thanh toán VNPay. Vui lòng đợi trong giây lát.
          </p>
        </div>
      </div>
    );
  }

  // Lỗi không tìm thấy đơn hàng
  if (errorMsg || !transaction) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 max-w-xl w-full text-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thông tin</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
            {errorMsg || "Mã đơn hàng không tồn tại hoặc đã bị hủy khỏi hệ thống."}
          </p>
          <div className="flex gap-3 justify-center max-w-xs mx-auto">
            <Link
              href="/nap-xu"
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors text-center"
            >
              Về trang nạp Xu
            </Link>
            <Link
              href="/"
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = transaction.status === "SUCCESS";
  const isFailed = transaction.status === "FAILED";
  const isPending = transaction.status === "PENDING";

  return (
    <div className="min-h-[calc(100vh-140px)] py-6 px-4 sm:px-6 flex items-center justify-center">
      {/* Khung biên lai chuẩn 1 màn hình PC - Bố cục dọc nguyên bản với icon tích ở đầu, nền trắng sạch sẽ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-xl w-full p-6 sm:p-7 transition-all">
        {/* ─── Header: Icon ở đầu + Tiêu đề + Mô tả 1 dòng ─────────── */}
        <div className="text-center">
          {/* 1. KHI THÀNH CÔNG: Hiệu ứng xoay tích xanh nhạt ở đầu */}
          {isSuccess && (
            <div className="relative w-16 h-16 mx-auto animate-badge-spring flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100/60 animate-ping opacity-25" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs flex items-center justify-center">
                <svg className="w-11 h-11" viewBox="0 0 52 52">
                  <circle
                    className="stroke-emerald-100"
                    cx="26"
                    cy="26"
                    r="23"
                    fill="none"
                    strokeWidth="3"
                  />
                  <circle
                    className="stroke-emerald-500 animate-circle-draw"
                    cx="26"
                    cy="26"
                    r="23"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ strokeDasharray: 166, strokeDashoffset: 166 }}
                  />
                  <path
                    className="stroke-emerald-600 animate-check-draw"
                    fill="none"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 27l7 7 15-16"
                    style={{ strokeDasharray: 48, strokeDashoffset: 48 }}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* 2. KHI ĐANG CHỜ (PENDING): Vòng xoay xanh công nghệ ở đầu */}
          {isPending && (
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100/70 animate-ping opacity-30" />
              <div className="w-16 h-16 rounded-full border-[3.5px] border-blue-100 border-t-blue-600 border-r-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                  <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* 3. KHI THẤT BẠI: Icon đỏ cảnh báo ở đầu */}
          {isFailed && (
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 shadow-2xs flex items-center justify-center text-rose-500">
                <svg className="w-8 h-8 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}

          {/* Tiêu đề & mô tả đúng 1 dòng duy nhất */}
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
            {isSuccess && "Thanh toán thành công!"}
            {isFailed && "Thanh toán không thành công"}
            {isPending && "Đang chờ xác nhận giao dịch"}
          </h1>

          <p className="text-xs text-slate-500 mt-1 truncate max-w-md mx-auto">
            {isSuccess && "Giao dịch đã được hệ thống VNPay xác nhận thành công."}
            {isFailed && "Giao dịch đã bị hủy hoặc chưa hoàn tất thanh toán."}
            {isPending && "Cổng VNPay đang xử lý giao dịch. Vui lòng bấm 'Tải lại' nếu vừa hoàn tất."}
          </p>

          {/* Hộp nổi bật Số tiền & Xu nhận được (ngang, gọn gàng) */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-around">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Số tiền thanh toán
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Xu nhận được
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <div className="relative w-4.5 h-4.5 shrink-0">
                  <Image src="/icon/coin.svg" alt="Xu" width={18} height={18} className="w-full h-full object-contain" />
                </div>
                <span className="text-lg sm:text-xl font-black text-amber-600">
                  {transaction.totalCoin.toLocaleString("vi-VN")} Xu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Chi Tiết Hóa Đơn (2 Cột Gọn Gàng) ────────────────────── */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chi tiết giao dịch
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isFailed
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {isSuccess && "✓ Đã thanh toán"}
              {isFailed && "✕ Thất bại"}
              {isPending && "⏳ Đang chờ xác nhận"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/70">
            {/* Mã đơn hàng + nút copy */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Mã đơn hàng:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-slate-900">{transaction.orderCode}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderCode}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Sao chép mã đơn"
                >
                  {copied ? (
                    <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Gói nạp */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Gói nạp Xu:</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{transaction.packageName}</span>
            </div>

            {/* Phương thức */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Phương thức:</span>
              <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5">
                <span className="text-[#ED1C24] font-black">VN</span>
                <span className="text-[#005BAA] font-black">PAY</span>
                <span className="text-slate-400 font-normal text-[11px]">(Sandbox)</span>
              </div>
            </div>

            {/* Mã GD VNPay */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Mã GD VNPay:</span>
              <span className="font-mono text-slate-700 mt-0.5 block">
                {transaction.transactionNo || "Đang đối soát..."}
              </span>
            </div>

            {/* Ngân hàng */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Ngân hàng thanh toán:</span>
              <span className="font-medium text-slate-700 mt-0.5 block">
                {transaction.bankCode || "VNPAY-QR / Thẻ nội địa"}
              </span>
            </div>

            {/* Thời gian */}
            <div className="flex items-center justify-between sm:block">
              <span className="text-slate-500 block text-[11px]">Thời gian thực hiện:</span>
              <span className="text-slate-700 mt-0.5 block">{formatDate(transaction.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* ─── Nút Hành Động ───────────────────────────────────────── */}
        <div className="mt-5 space-y-2.5">
          {/* Nút Refresh nếu đang PENDING */}
          {isPending && (
            <button
              type="button"
              onClick={() => loadTransaction(true)}
              disabled={isRefreshing}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? "Đang kiểm tra từ VNPay..." : "Tải lại trạng thái giao dịch"}</span>
            </button>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-center rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Tiếp tục đọc truyện</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/nap-xu"
              className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-center rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center"
            >
              <span>{isSuccess ? "Nạp thêm Xu" : "Thử gói khác"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="w-10 h-10 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
