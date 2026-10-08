"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { toSlug } from "@/lib/utils/slug";
import type { CategoryItem } from "@/types/category";

interface Props {
  open: boolean;
  category: CategoryItem | null; // null => Chế độ tạo mới; CategoryItem => Chế độ sửa
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    slug?: string;
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
}

export function CategoryFormModal({
  open,
  category,
  isLoading,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(category);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setIsActive(category.isActive);
      setIsManualSlug(true);
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setIsActive(true);
      setIsManualSlug(false);
    }
    setError(null);
  }, [category, open]);

  if (!open) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    if (!isManualSlug) {
      setSlug(toSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsManualSlug(true);
    setSlug(toSlug(val));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên thể loại");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Tên thể loại phải từ 2 đến 50 ký tự");
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        slug: slug.trim() ? slug.trim() : undefined,
        description: description.trim() ? description.trim() : undefined,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Đã có lỗi xảy ra");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/60">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
                {error}
              </div>
            )}

            {/* Tên Thể Loại */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên thể loại / danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Tiên Hiệp, Đô Thị, Huyền Huyễn..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Từ 2 đến 50 ký tự, tên thể loại không được trùng lặp.
              </p>
            </div>

            {/* Slug URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Định danh URL (Slug)
                </label>
                {isManualSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualSlug(false);
                      setSlug(toSlug(name));
                    }}
                    className="text-[11px] text-sky-600 hover:underline cursor-pointer"
                  >
                    Tự sinh theo tên
                  </button>
                )}
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="tien-hiep"
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Chuỗi định danh hiển thị trên URL. Nếu để trống sẽ tự động lấy từ tên.
              </p>
            </div>

            {/* Mô tả thể loại */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mô tả chi tiết (Tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả tóm tắt về đặc trưng của thể loại này..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors resize-none"
              />
            </div>

            {/* Trạng thái hoạt động */}
            <div className="pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">
                  Kích hoạt thể loại (hiển thị trên thanh menu và bộ lọc truyện)
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {isLoading
                ? "Đang lưu..."
                : isEdit
                ? "Lưu thay đổi"
                : "Tạo thể loại"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
