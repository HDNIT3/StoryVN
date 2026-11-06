"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "storyvn_cookie_consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đồng ý cookie từ trước chưa
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      // Bỏ qua lỗi truy cập localStorage (nếu có chế độ private chặn)
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // Ignored
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Thông báo Cookie"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-2xl p-4 sm:p-5 text-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5"
    >
      <div className="flex items-start gap-3.5">
        {/* Cookie icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 text-xl shadow-2xs">
          🍪
        </div>

        <div className="flex-1 space-y-1.5">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Chúng tôi sử dụng Cookie
          </h4>
          <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
            Chúng tôi sử dụng cookie để tối ưu trải nghiệm của bạn khi đọc truyện và lưu các tùy chọn cá nhân. Xem thêm tại{" "}
            <Link
              href="/chinh-sach-bao-mat"
              className="text-sky-600 font-semibold hover:underline"
            >
              Chính sách bảo mật
            </Link>
            .
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default CookieBanner;

