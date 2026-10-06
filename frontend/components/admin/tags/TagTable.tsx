"use client";

import React from "react";
import type { TagItem } from "@/types/tag";

interface Props {
  items: TagItem[];
  isLoading: boolean;
  page?: number;
  limit?: number;
  onEdit: (tag: TagItem) => void;
  onDelete: (tag: TagItem) => void;
}

export function TagTable({
  items,
  isLoading,
  page = 1,
  limit = 10,
  onEdit,
  onDelete,
}: Props) {
  // Format ngày hiển thị
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="py-3.5 px-4 text-center w-16">STT</th>
              <th className="py-3.5 px-4">Tên thẻ tag</th>
              <th className="py-3.5 px-4">Định danh (Slug)</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4">Ngày tạo</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading && items.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 bg-slate-200 rounded w-6 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 rounded w-24" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-slate-100 rounded w-28" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-7 bg-slate-200 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Trạng thái trống
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">Không tìm thấy thẻ tag nào</p>
                    <p className="text-xs text-slate-400">
                      Hãy thử thay đổi bộ lọc hoặc thêm thẻ tag mới
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Danh sách tag
              items.map((tag, idx) => {
                const stt = (page - 1) * limit + idx + 1;
                return (
                  <tr
                    key={tag._id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Cột STT */}
                    <td className="py-3 px-4 text-center font-medium text-xs text-slate-400">
                      {stt}
                    </td>

                    {/* Tên tag */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {tag.name}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/60">
                        {tag.slug}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      {tag.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Tạm khóa
                        </span>
                      )}
                    </td>

                    {/* Ngày tạo */}
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(tag.createdAt)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(tag)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa thẻ tag"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => onDelete(tag)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa thẻ tag"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
