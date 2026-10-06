"use client";

import React from "react";
import { Button } from "@/components/ui";
import type { TagItem } from "@/types/tag";

interface Props {
  open: boolean;
  tag: TagItem | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function TagDeleteModal({
  open,
  tag,
  isLoading,
  onClose,
  onConfirm,
}: Props) {
  if (!open || !tag) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {/* Danger Icon */}
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1.5">
            Xác nhận xóa thẻ tag?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bạn có chắc chắn muốn xóa thẻ tag{" "}
            <strong className="text-slate-800">#{tag.name}</strong>? Thao tác này sẽ xóa hoàn toàn thẻ tag khỏi hệ thống và không thể hoàn tác.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="w-full border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
