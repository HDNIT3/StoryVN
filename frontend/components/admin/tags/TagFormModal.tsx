"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { toSlug } from "@/lib/utils/slug";
import type { TagItem } from "@/types/tag";

interface Props {
  open: boolean;
  tag: TagItem | null; // null => Chế độ tạo mới; TagItem => Chế độ sửa
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; slug?: string; isActive: boolean }) => Promise<void>;
}

export function TagFormModal({
  open,
  tag,
  isLoading,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(tag);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setSlug(tag.slug);
      setIsActive(tag.isActive);
      setIsManualSlug(true);
    } else {
      setName("");
      setSlug("");
      setIsActive(true);
      setIsManualSlug(false);
    }
    setError(null);
  }, [tag, open]);

  if (!open) return null;

  // Khi gõ tên tag, nếu chưa tự chỉnh sửa slug thủ công thì tự sinh slug
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
      setError("Vui lòng nhập tên thẻ tag");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Tên thẻ tag phải từ 2 đến 50 ký tự");
      return;
    }

    try {
      await onSubmit({
        name: trimmedName,
        slug: slug.trim() ? slug.trim() : undefined,
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
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa thẻ tag" : "Thêm thẻ tag mới"}
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
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl">
                {error}
              </div>
            )}

            {/* Tên Tag */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên thẻ tag <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Xuyên Không, Hệ Thống, Trọng Sinh..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Từ 2 đến 50 ký tự, không được trùng với tag đã tồn tại.
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
                placeholder="xuyen-khong"
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Định danh trên đường dẫn URL. Nếu bỏ trống, hệ thống sẽ tự sinh từ tên tag.
              </p>
            </div>

            {/* Trạng thái hoạt động */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">
                  Kích hoạt thẻ tag (cho phép người đọc & tác giả gắn thẻ)
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
                : "Tạo thẻ tag"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
