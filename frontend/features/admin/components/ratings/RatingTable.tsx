"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminRatingItem, AdminRatingStatus } from "../../types/rating.types";

interface RatingTableProps {
  ratings: AdminRatingItem[];
  isLoading?: boolean;
  onViewDetail: (rating: AdminRatingItem) => void;
  onUpdateStatus: (ratingId: string, status: AdminRatingStatus) => void;
  onDeletePermanent: (ratingId: string) => void;
  isUpdating?: boolean;
}

export function RatingTable({
  ratings,
  isLoading,
  onViewDetail,
  onUpdateStatus,
  onDeletePermanent,
  isUpdating,
}: RatingTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
            <div className="w-20 h-6 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl">
          ★
        </div>
        <p className="text-sm font-bold text-slate-800">Không tìm thấy đánh giá nào</p>
        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4">Người đánh giá</th>
              <th className="py-3.5 px-4">Tác phẩm</th>
              <th className="py-3.5 px-4">Số sao</th>
              <th className="py-3.5 px-4 min-w-[200px]">Nhận xét</th>
              <th className="py-3.5 px-4">Ngày gửi</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ratings.map((item) => {
              const user = item.userId;
              const story = item.storyId;
              const isHidden = item.status === "HIDDEN";

              return (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Người đánh giá */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                        {user?.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName || "Avatar"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[11px] text-amber-700 bg-amber-100">
                            {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[130px]">
                          {user?.displayName || user?.username || "Ẩn danh"}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          @{user?.username || "user"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tác phẩm */}
                  <td className="py-3.5 px-4 align-top max-w-[160px]">
                    {story ? (
                      <Link
                        href={`/truyen/${story.slug}`}
                        target="_blank"
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 block text-xs"
                        title={story.title}
                      >
                        {story.title}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Không rõ</span>
                    )}
                  </td>

                  {/* Số sao */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="font-black text-amber-600 text-sm">{item.rating}</span>
                      <span className="text-amber-500 text-sm">★</span>
                    </div>
                  </td>

                  {/* Nhận xét */}
                  <td className="py-3.5 px-4 align-top">
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-800">
                      {item.review ? item.review : <span className="text-slate-400 italic">Không có nhận xét văn bản</span>}
                    </p>
                  </td>

                  {/* Ngày gửi */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "VISIBLE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isHidden
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "VISIBLE"
                            ? "bg-emerald-500"
                            : isHidden
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      {item.status === "VISIBLE"
                        ? "Hiển thị"
                        : isHidden
                        ? "Đang ẩn"
                        : "Đã xóa"}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Nút Ẩn / Hiện */}
                      {item.status === "VISIBLE" ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onUpdateStatus(item._id, "HIDDEN")}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Ẩn đánh giá"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => onUpdateStatus(item._id, "VISIBLE")}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Cho hiện lại"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}

                      {/* Xóa vĩnh viễn */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này? Hệ thống sẽ tính lại điểm trung bình.")) {
                            onDeletePermanent(item._id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Xóa vĩnh viễn"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

