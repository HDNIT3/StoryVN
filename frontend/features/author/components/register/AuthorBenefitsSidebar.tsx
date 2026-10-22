"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function AuthorBenefitsSidebar() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          title="Quay lại"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">Đăng ký Tác giả</h1>
          <p className="text-xs text-zinc-500 truncate">StoryVN Creator Program</p>
        </div>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed">
        Trở thành tác giả trên StoryVN để tiếp cận hàng ngàn bạn đọc yêu mến tiểu thuyết, xây dựng cộng đồng người theo dõi và phát triển tác phẩm của riêng bạn.
      </p>

      {/* Benefits banner */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-4 sm:p-5 text-white space-y-3 shadow-xs">
        <h2 className="font-bold text-sm sm:text-base flex items-center gap-2">
          <span>✨</span> Quyền lợi khi là Tác giả
        </h2>
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📖</span>
            <span>Đăng tải và quản lý không giới hạn tác phẩm</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base">💰</span>
            <span>Cơ chế chia sẻ doanh thu và nhận ủng hộ</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base">👥</span>
            <span>Tương tác trực tiếp và xây dựng fan base</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-base">🏆</span>
            <span>Huy hiệu Tác giả chính thức trên hồ sơ</span>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-500 space-y-1">
        <p className="font-semibold text-zinc-700">Lưu ý khi gửi hồ sơ:</p>
        <p>• Hồ sơ xét duyệt thường hoàn tất trong vòng 24 - 48 giờ.</p>
        <p>• Vui lòng cung cấp đúng thông tin để ban quản trị liên hệ hỗ trợ.</p>
      </div>
    </div>
  );
}
