"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui";

const POPULAR_TAGS = [
  // Chủ đề & Mô típ
  { name: "Xuyên Không", category: "Mô típ" },
  { name: "Trọng Sinh", category: "Mô típ" },
  { name: "Hệ Thống", category: "Mô típ" },
  { name: "Bàn Tay Vàng", category: "Mô típ" },
  { name: "Linh Khí Khôi Phục", category: "Mô típ" },
  { name: "Tận Thế Sinh Tồn", category: "Mô típ" },
  { name: "Gia Tộc Quản Lý", category: "Mô típ" },
  { name: "Làm Giàu", category: "Mô típ" },
  { name: "Thập Niên 70-80", category: "Mô típ" },
  // Nhân vật & Tính cách
  { name: "Vô Địch", category: "Nhân vật" },
  { name: "Cẩu Đạo", category: "Nhân vật" },
  { name: "Sát Phạt Quyết Đoán", category: "Nhân vật" },
  { name: "Giả Heo Ăn Hổ", category: "Nhân vật" },
  { name: "Cơ Trí", category: "Nhân vật" },
  { name: "Lạnh Lùng", category: "Nhân vật" },
  { name: "Hài Hước Bựa", category: "Nhân vật" },
  { name: "Phản Phái", category: "Nhân vật" },
  { name: "Nữ Cường", category: "Nhân vật" },
  // Tình cảm
  { name: "Đơn Nữ Chính", category: "Tình cảm" },
  { name: "Hậu Cung", category: "Tình cảm" },
  { name: "Không Nữ Chính", category: "Tình cảm" },
  { name: "Ngọt Sủng", category: "Tình cảm" },
  { name: "Ngược Luyến", category: "Tình cảm" },
  { name: "Cưới Trước Yêu Sau", category: "Tình cảm" },
  { name: "Thanh Mai Trúc Mã", category: "Tình cảm" },
  // Kỹ năng & Nghề nghiệp
  { name: "Luyện Đan", category: "Kỹ năng" },
  { name: "Luyện Khí", category: "Kỹ năng" },
  { name: "Trận Pháp", category: "Kỹ năng" },
  { name: "Ngự Thú Sư", category: "Kỹ năng" },
  { name: "Kiếm Tu", category: "Kỹ năng" },
  { name: "Y Thuật", category: "Kỹ năng" },
];

interface TagPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onConfirm: (tags: string[]) => void;
}

export function TagPickerModal({
  isOpen,
  onClose,
  selectedTags,
  onConfirm,
}: TagPickerModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedTags);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedTags);
      setSearch("");
      setActiveCategory("ALL");
    }
  }, [isOpen, selectedTags]);

  const categories = ["ALL", "Mô típ", "Nhân vật", "Tình cảm", "Kỹ năng"];

  const filteredTags = useMemo(() => {
    return POPULAR_TAGS.filter((tag) => {
      const matchSearch =
        !search.trim() ||
        tag.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchCategory =
        activeCategory === "ALL" || tag.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory]);

  const handleToggleTag = (name: string) => {
    if (tempSelected.includes(name)) {
      setTempSelected(tempSelected.filter((t) => t !== name));
    } else {
      setTempSelected([...tempSelected, name]);
    }
  };

  const handleApply = () => {
    onConfirm(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Chọn thẻ Tag tác phẩm</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Đã chọn: <strong className="text-sky-600 font-semibold">{tempSelected.length}</strong> thẻ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-3 border-b border-zinc-100 space-y-2.5 bg-white">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thẻ tag..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
            <svg
              className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat === "ALL" ? "Tất cả" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Checkbox Grid List */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[360px] grid grid-cols-2 gap-2">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => {
              const isChecked = tempSelected.includes(tag.name);
              return (
                <label
                  key={tag.name}
                  onClick={() => handleToggleTag(tag.name)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                    isChecked
                      ? "bg-sky-50/80 border-sky-300 text-sky-900 font-medium"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer pointer-events-none"
                  />
                  <span className="truncate">{tag.name}</span>
                </label>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-xs text-zinc-400">
              Không tìm thấy tag phù hợp với từ khóa &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setTempSelected([])}
            className="text-xs text-zinc-500 hover:text-zinc-700 underline cursor-pointer"
          >
            Bỏ chọn tất cả
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button size="sm" variant="primary" onClick={handleApply}>
              Xác nhận ({tempSelected.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
