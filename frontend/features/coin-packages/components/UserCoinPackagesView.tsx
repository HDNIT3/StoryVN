"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useActiveCoinPackages } from "@/features/coin-packages/queries/useCoinPackageQueries";
import type { CoinPackageItem } from "@/features/coin-packages/types";
import { paymentService } from "@/features/payments";
import { CoinPackagePurchaseModal } from "./CoinPackagePurchaseModal";
import { toast } from "@/lib/toast";

export function UserCoinPackagesView() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: packages, isLoading, isError, refetch } = useActiveCoinPackages();

  const [selectedPkg, setSelectedPkg] = useState<CoinPackageItem | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const handleOpenModal = (pkg: CoinPackageItem) => {
    setSelectedPkg(pkg);
    setIsPurchaseModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmittingPayment) return;
    setIsPurchaseModalOpen(false);
  };

  const handleConfirmPurchase = async (pkg: CoinPackageItem) => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập tài khoản để thực hiện nạp Xu!");
      router.push("/dang-nhap?redirect=/nap-xu");
      return;
    }

    if (isSubmittingPayment) return;

    try {
      setIsSubmittingPayment(true);
      const res = await paymentService.createVnpayPayment(pkg._id);
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        toast.error("Không nhận được liên kết thanh toán từ cổng VNPay");
        setIsSubmittingPayment(false);
      }
    } catch (err: any) {
      setIsSubmittingPayment(false);
      toast.error(
        err.message || "Không thể khởi tạo giao dịch thanh toán VNPay. Vui lòng thử lại sau ít phút!"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pt-6 pb-12 sm:pt-8 sm:pb-16 px-4 sm:px-6 lg:px-8">
      {/* ─── Header: Căn trái, có Logo Xu đàng hoàng, giãn trên dưới vừa vặn ─── */}
      <div className="max-w-5xl mx-auto mb-6 sm:mb-7">
        <div className="flex items-center gap-3">
          {/* Logo Xu đàng hoàng */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
            <div className="w-full h-full rounded-[10px] bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center p-1.5 border border-amber-200/80">
              <Image
                src="/icon/coin.svg"
                alt="Logo Xu StoryVN"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Bảng Gói Nạp Xu
            </h1>
          </div>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl leading-normal text-left">
          Chọn gói nạp Xu phù hợp để mở khóa các chương truyện VIP và ủng hộ tác giả.
        </p>
      </div>

      {/* ─── Main Content Container (Căn cùng độ rộng max-w-5xl) ───────── */}
      <div className="max-w-5xl mx-auto">
        {/* Loading Skeleton: Card nhỏ gọn */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-3.5 sm:p-4 border border-slate-200 shadow-2xs animate-pulse space-y-2.5"
              >
                <div className="h-4 bg-slate-200 rounded w-20" />
                <div className="h-16 bg-amber-50 rounded-md w-full" />
                <div className="h-6 bg-slate-100 rounded-md w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-white rounded-lg p-6 border border-rose-200 text-center shadow-2xs max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-bold text-sm text-slate-800">Không thể tải danh sách gói nạp Xu</p>
            <p className="text-xs text-slate-500 mt-0.5">Đã có lỗi xảy ra hoặc hệ thống đang bảo trì.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!packages || packages.length === 0) && (
          <div className="bg-white rounded-lg p-8 border border-slate-200 text-center shadow-2xs max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2.5 border border-amber-200">
              <Image
                src="/icon/coin.svg"
                alt="Coin"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
            </div>
            <p className="text-sm font-bold text-slate-800">Hiện chưa có gói nạp nào được mở</p>
            <p className="text-xs text-slate-500 mt-0.5">Vui lòng quay lại sau ít phút hoặc liên hệ quản trị viên.</p>
          </div>
        )}

        {/* Danh sách các gói nạp: Card nhỏ gọn, sắc sảo và thẩm mỹ */}
        {!isLoading && packages && packages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {packages.map((pkg) => {
              const isFeatured = pkg.isFeatured;
              const hasBonus = pkg.bonusCoin > 0;
              const bonusPercent = hasBonus ? Math.round((pkg.bonusCoin / pkg.coinAmount) * 100) : 0;

              return (
                <div
                  key={pkg._id}
                  onClick={() => handleOpenModal(pkg)}
                  className={`group relative rounded-lg p-3 sm:p-3.5 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between overflow-hidden ${
                    isFeatured
                      ? "bg-linear-to-b from-amber-50/50 via-white to-white border-2 border-amber-400 hover:border-amber-500 shadow-2xs hover:shadow-md hover:-translate-y-1"
                      : "bg-white border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  {/* Badge HOT / Nổi bật ở góc trên bên phải */}
                  {isFeatured && (
                    <div className="absolute top-0 right-0">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-bl text-[9px] font-black uppercase tracking-wider bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-2xs">
                        ★ HOT
                      </span>
                    </div>
                  )}

                  {/* Phần trên: Tên gói */}
                  <div>
                    <div className="flex items-start justify-between gap-1 pr-10">
                      <h3
                        className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate"
                        title={pkg.name}
                      >
                        {pkg.name}
                      </h3>
                    </div>

                    {/* Khối hiển thị Tổng Xu: Compact, kèm icon Xu chuẩn */}
                    <div className="my-2.5 p-2.5 rounded-md bg-linear-to-br from-amber-50/90 to-orange-50/60 border border-amber-200/80 text-center relative transition-colors group-hover:border-amber-300">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="relative w-5 h-5 shrink-0">
                          <Image
                            src="/icon/coin.svg"
                            alt="Xu"
                            width={20}
                            height={20}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
                          {pkg.totalCoin.toLocaleString("vi-VN")}
                        </span>
                        <span className="text-[11px] font-extrabold text-amber-700 uppercase">Xu</span>
                      </div>

                      {/* Phân rã Xu cơ bản + Thưởng */}
                      <div className="mt-1.5 pt-1.5 border-t border-amber-200/50 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px]">
                        <span className="text-slate-600">
                          Gốc: <strong>{pkg.coinAmount.toLocaleString("vi-VN")}</strong>
                        </span>
                        {hasBonus && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200">
                            +{pkg.bonusCoin.toLocaleString("vi-VN")}
                            {bonusPercent > 0 && ` (+${bonusPercent}%)`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phần dưới: Giá tiền & Nút hành động */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5">
                        Giá nạp
                      </span>
                      <span className="text-sm sm:text-base font-black text-indigo-700 group-hover:text-indigo-800 transition-colors">
                        {formatCurrency(pkg.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(pkg);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 group-hover:bg-amber-600 text-white font-bold text-[11px] sm:text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Nạp ngay</span>
                      <svg
                        className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal xác nhận nạp Xu ─────────────────────────────────── */}
      <CoinPackagePurchaseModal
        isOpen={isPurchaseModalOpen}
        pkg={selectedPkg}
        isLoading={isSubmittingPayment}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
}

export default UserCoinPackagesView;
