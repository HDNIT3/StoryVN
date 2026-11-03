"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type {
  CoinPackageItem,
  CreateCoinPackagePayload,
  UpdateCoinPackagePayload,
} from "@/features/coin-packages/types";

interface Props {
  open: boolean;
  pkg: CoinPackageItem | null; // null => Chế độ tạo mới; CoinPackageItem => Chế độ sửa
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCoinPackagePayload | UpdateCoinPackagePayload) => Promise<void>;
}

export function CoinPackageFormModal({
  open,
  pkg,
  isLoading,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">(20000);
  const [coinAmount, setCoinAmount] = useState<number | "">(200);
  const [bonusCoin, setBonusCoin] = useState<number | "">(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState<number | "">(1);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(pkg);

  useEffect(() => {
    if (pkg) {
      setName(pkg.name);
      setPrice(pkg.price);
      setCoinAmount(pkg.coinAmount);
      setBonusCoin(pkg.bonusCoin || 0);
      setIsActive(pkg.isActive);
      setIsFeatured(pkg.isFeatured);
      setSortOrder(pkg.sortOrder || 1);
    } else {
      setName("");
      setPrice(20000);
      setCoinAmount(200); // 1000đ = 10 xu => 20.000đ = 200 xu
      setBonusCoin(0);
      setIsActive(true);
      setIsFeatured(false);
      setSortOrder(1);
    }
    setError(null);
  }, [pkg, open]);

  if (!open) return null;

  const numCoinAmount = typeof coinAmount === "number" ? coinAmount : 0;
  const numBonusCoin = typeof bonusCoin === "number" ? bonusCoin : 0;
  const calculatedTotalCoin = numCoinAmount + numBonusCoin;
  const numPrice = typeof price === "number" ? price : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên gói nạp");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Tên gói nạp phải từ 2 đến 100 ký tự");
      return;
    }

    if (typeof price !== "number" || price < 0) {
      setError("Giá tiền phải là số lớn hơn hoặc bằng 0");
      return;
    }

    if (typeof coinAmount !== "number" || coinAmount < 1) {
      setError("Số Xu cơ bản phải tối thiểu là 1");
      return;
    }

    if (typeof bonusCoin === "number" && bonusCoin < 0) {
      setError("Số Xu thưởng không được âm");
      return;
    }

    if (typeof sortOrder !== "number" || sortOrder < 1) {
      setError("Thứ tự hiển thị phải bắt đầu từ 1");
      return;
    }

    setError(null);

    await onSubmit({
      name: trimmedName,
      price,
      coinAmount,
      bonusCoin: typeof bonusCoin === "number" ? bonusCoin : 0,
      isActive,
      isFeatured,
      sortOrder: typeof sortOrder === "number" ? Math.max(1, sortOrder) : 1,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa gói nạp Xu" : "Thêm gói nạp Xu mới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Cập nhật mệnh giá, số Xu thưởng và thứ tự hiển thị"
                : "Tạo gói nạp mới cho độc giả nạp Xu trên hệ thống (1.000đ = 10 Xu)"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Thông tin cơ bản & Trạng thái */}
            <div className="space-y-3.5">
              {/* Tên gói */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên gói nạp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="VD: Gói Tân Thủ, Gói Tiết Kiệm..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800"
                  required
                />
              </div>

              {/* Toggles: isFeatured & isActive */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span>Gói nổi bật (Hot)</span>
                      <span className="text-amber-500 text-xs">⭐</span>
                    </span>
                    <p className="text-[11px] text-slate-500">Làm sáng thẻ và gắn nhãn ưu đãi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Kích hoạt gói nạp</span>
                    <p className="text-[11px] text-slate-500">Hiển thị cho độc giả nạp Xu</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Cột 2: Mệnh giá & Xu */}
            <div className="space-y-3.5">
              {/* Giá tiền & Thứ tự */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá tiền (VND) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={price}
                      onChange={(e) => {
                        const v = e.target.value === "" ? "" : Number(e.target.value);
                        setPrice(v);
                        // Tự động tính Xu cơ bản: 1.000đ = 10 Xu (chia 100)
                        if (typeof v === "number" && v >= 0) {
                          setCoinAmount(Math.floor(v / 100));
                        }
                      }}
                      className="w-full pl-3 pr-7 py-2 text-sm bg-slate-50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-slate-900"
                      required
                    />
                    <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                      ₫
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {formatCurrency(numPrice)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thứ tự hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                      setSortOrder(v);
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 font-semibold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 truncate" title="Bắt đầu từ 1. Nếu trùng số sẽ tự động hoán đổi vị trí gói cũ.">
                    Bắt đầu từ 1, tự hoán đổi
                  </p>
                </div>
              </div>

              {/* Xu cơ bản & Xu thưởng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xu cơ bản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={coinAmount}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value);
                      setCoinAmount(v);
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 font-semibold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    Tỷ lệ: 1.000đ = 10 Xu
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Xu thưởng thêm
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bonusCoin}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value);
                      setBonusCoin(v);
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    {numBonusCoin > 0 && numCoinAmount > 0
                      ? `Tặng +${Math.round((numBonusCoin / numCoinAmount) * 100)}%`
                      : "Không bắt buộc"}
                  </p>
                </div>
              </div>

              {/* Box Tổng Xu nhận được */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/60 rounded-lg border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-900 block">
                    Tổng Xu nhận được
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-amber-950">
                      {calculatedTotalCoin.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-xs font-extrabold text-amber-700 uppercase">Xu</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-600">
                  <p>Gốc: <strong className="text-slate-800">{numCoinAmount.toLocaleString("vi-VN")}</strong></p>
                  {numBonusCoin > 0 && (
                    <p className="text-emerald-700 font-semibold">
                      +{numBonusCoin.toLocaleString("vi-VN")} thưởng
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isEdit ? "Lưu thay đổi" : "Tạo gói nạp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
