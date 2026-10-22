"use client";

import React, { useState, useMemo } from "react";

export interface TagItemOption {
  _id?: string;
  name: string;
  slug?: string;
}

const DEFAULT_POPULAR_TAGS: TagItemOption[] = [
  { name: "Xuyên Không" },
  { name: "Trọng Sinh" },
  { name: "Hệ Thống" },
  { name: "Bàn Tay Vàng" },
  { name: "Linh Khí Khôi Phục" },
  { name: "Tận Thế Sinh Tồn" },
  { name: "Gia Tộc Quản Lý" },
  { name: "Làm Giàu" },
  { name: "Thập Niên 70-80" },
  { name: "Xuyên Sách" },
  { name: "Vô Địch" },
  { name: "Cẩu Đạo" },
  { name: "Sát Phạt Quyết Đoán" },
  { name: "Giả Heo Ăn Hổ" },
  { name: "Cơ Trí" },
  { name: "Lạnh Lùng" },
  { name: "Hài Hước Bựa" },
  { name: "Phản Phái" },
  { name: "Nữ Cường" },
  { name: "Điềm Đạm" },
  { name: "Đơn Nữ Chính" },
  { name: "Hậu Cung" },
  { name: "Không Nữ Chính" },
  { name: "Ngọt Sủng" },
  { name: "Ngược Luyến" },
  { name: "Cưới Trước Yêu Sau" },
  { name: "Thanh Mai Trúc Mã" },
  { name: "Gương Vỡ Lại Lành" },
  { name: "Luyện Đan" },
  { name: "Luyện Khí" },
  { name: "Trận Pháp" },
  { name: "Ngự Thú Sư" },
  { name: "Kiếm Tu" },
  { name: "Y Thuật" },
];

interface TagPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags?: TagItemOption[];
  selectedTags: string[];
  onConfirm: (tags: string[]) => void;
  maxSelect?: number;
}

export function TagPickerModal({
  isOpen,
  onClose,
  availableTags = [],
  selectedTags = [],
  onConfirm,
  maxSelect = 10,
}: TagPickerModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedTags);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedTags);
      setSearch("");
    }
  }, [isOpen, selectedTags]);

  const allTags = useMemo(() => {
    if (availableTags && availableTags.length > 0) {
      return availableTags;
    }
    return DEFAULT_POPULAR_TAGS;
  }, [availableTags]);

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [allTags, search]);

  const handleToggleTag = (name: string) => {
    if (tempSelected.includes(name)) {
      setTempSelected((prev) => prev.filter((t) => t !== name));
    } else {
      if (tempSelected.length >= maxSelect) {
        return;
      }
      setTempSelected((prev) => [...prev, name]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (!tempSelected.includes(trimmed)) {
      if (tempSelected.length >= maxSelect) return;
      setTempSelected((prev) => [...prev, trimmed]);
    }
    setSearch("");
  };

  const handleApply = () => {
    onConfirm(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-100">
      <div
        className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col shadow-lg border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Chọn thẻ tag cho tác phẩm</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Đã chọn: <strong className="text-sky-600 font-semibold">{tempSelected.length}</strong>/{maxSelect} thẻ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Selected Summary Bar */}
        {tempSelected.length > 0 && (
          <div className="p-3 bg-sky-50/40 border-b border-zinc-200 flex flex-wrap items-center gap-1.5 text-xs max-h-24 overflow-y-auto">
            <span className="font-semibold text-zinc-700 mr-1 text-[11px]">Đã chọn:</span>
            {tempSelected.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-600 text-white font-medium shadow-2xs text-xs"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="text-white/80 hover:text-white font-bold cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Tìm kiếm hoặc nhập tag mới rồi Enter..."
              className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            {search.trim() && (
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-xs font-semibold cursor-pointer shrink-0"
              >
                + Thêm &quot;{search.trim()}&quot;
              </button>
            )}
          </div>
        </div>

        {/* Tags Grid List */}
        <div className="p-3 overflow-y-auto flex-1 max-h-[360px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredTags.map((tag) => {
              const isSelected = tempSelected.includes(tag.name);
              return (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => handleToggleTag(tag.name)}
                  className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer transition select-none text-left ${
                    isSelected
                      ? "bg-sky-50/80 border-sky-400 text-sky-900 font-semibold ring-1 ring-sky-400"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50/60"
                  }`}
                >
                  <span className="truncate">#{tag.name}</span>
                  {isSelected && (
                    <span className="text-sky-600 font-bold ml-1 text-xs shrink-0">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-400">
              <p>Không tìm thấy thẻ tag nào cho &quot;{search}&quot;</p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="mt-2 text-sky-600 font-semibold hover:underline cursor-pointer"
                >
                  + Thêm &quot;{search.trim()}&quot; làm tag mới
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setTempSelected([])}
            className="text-xs text-zinc-500 hover:text-zinc-700 underline cursor-pointer"
          >
            Bỏ chọn tất cả
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition cursor-pointer shadow-2xs"
            >
              Xác nhận ({tempSelected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
