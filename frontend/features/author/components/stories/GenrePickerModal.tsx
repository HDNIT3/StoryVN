"use client";

import React, { useState, useMemo } from "react";

export interface GenreOption {
  _id?: string;
  name: string;
  slug?: string;
  description?: string | null;
}

const DEFAULT_GENRES_FALLBACK: GenreOption[] = [
  { name: "Tiên Hiệp", slug: "tien-hiep", description: "Tu chân, luyện khí, trường sinh" },
  { name: "Huyền Huyễn", slug: "huyen-huyen", description: "Dị giới, ma pháp, đấu khí" },
  { name: "Đô Thị", slug: "do-thi", description: "Hiện đại, thương trường, dị năng" },
  { name: "Ngôn Tình", slug: "ngon-tinh", description: "Tình cảm lãng mạn, sâu lắng" },
  { name: "Kiếm Hiệp", slug: "kiem-hiep", description: "Giang hồ, võ lâm, ân oán" },
  { name: "Khoa Huyễn", slug: "khoa-huyen", description: "Tương lai, cơ giáp, vũ trụ" },
  { name: "Võng Du", slug: "vong-du", description: "Game thực tế ảo, eSports" },
  { name: "Dị Giới", slug: "di-gioi", description: "Xuyên việt, sinh thái kỳ bí" },
  { name: "Linh Dị", slug: "linh-di", description: "Trừ tà, bắt ma, huyền bí" },
  { name: "Trinh Thám", slug: "trinh-tham", description: "Phá án, đấu trí, suy luận" },
  { name: "Lịch Sử", slug: "lich-su", description: "Triều đại, mưu lược, quân sự" },
  { name: "Mạt Thế", slug: "mat-the", description: "Tận thế, zombie, sinh tồn" },
  { name: "Hài Hước", slug: "hai-huoc", description: "Giải trí, dí dỏm, tiếng cười" },
  { name: "Đồng Nhân", slug: "dong-nhan", description: "Phóng tác anime, manga, game" },
  { name: "Cổ Đại", slug: "co-dai", description: "Phương đông cổ xưa, gia tộc" },
  { name: "Điền Văn", slug: "dien-van", description: "Nông thôn, ấm áp, gia đình" },
  { name: "Cung Đấu", slug: "cung-dau", description: "Tranh sủng hậu cung, mưu quyền" },
  { name: "Hào Môn Thế Gia", slug: "hao-mon-the-gia", description: "Tài phiệt, thượng lưu" },
  { name: "Thanh Xuân Vườn Trường", slug: "thanh-xuan-vuon-truong", description: "Học đường, tuổi trẻ" },
  { name: "Kỳ Huyễn", slug: "ky-huyen", description: "Ma pháp phương Tây, kỵ sĩ" },
  { name: "Vô Hạn Lưu", slug: "vo-han-luu", description: "Phó bản sinh tử, không gian luân hồi" },
];

interface GenrePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableGenres?: GenreOption[];
  selectedGenres: string[];
  onConfirm: (genres: string[]) => void;
  maxSelect?: number;
}

export function GenrePickerModal({
  isOpen,
  onClose,
  availableGenres = [],
  selectedGenres,
  onConfirm,
  maxSelect = 5,
}: GenrePickerModalProps) {
  const allGenres = useMemo(() => {
    if (availableGenres && availableGenres.length > 0) return availableGenres;
    return DEFAULT_GENRES_FALLBACK;
  }, [availableGenres]);

  const [tempSelected, setTempSelected] = useState<string[]>(selectedGenres || []);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedGenres || []);
      setSearch("");
    }
  }, [isOpen, selectedGenres]);

  const filteredGenres = useMemo(() => {
    if (!search.trim()) return allGenres;
    const q = search.trim().toLowerCase();
    return allGenres.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    );
  }, [allGenres, search]);

  const handleToggleGenre = (name: string) => {
    if (tempSelected.includes(name)) {
      setTempSelected((prev) => prev.filter((g) => g !== name));
    } else {
      if (tempSelected.length >= maxSelect) {
        return;
      }
      setTempSelected((prev) => [...prev, name]);
    }
  };

  const handleApply = () => {
    onConfirm(tempSelected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-100">
      <div
        className="bg-white rounded-lg max-w-xl w-full max-h-[85vh] flex flex-col shadow-lg border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Chọn thể loại tác phẩm</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Đã chọn {tempSelected.length}/{maxSelect} thể loại
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
          <div className="p-3 bg-sky-50/40 border-b border-zinc-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-zinc-700 mr-1">Đã chọn:</span>
            {tempSelected.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-600 text-white font-medium shadow-2xs"
              >
                <span>{genre}</span>
                <button
                  type="button"
                  onClick={() => handleToggleGenre(genre)}
                  className="text-white/80 hover:text-white font-bold cursor-pointer ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-zinc-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thể loại (vd: Tiên Hiệp, Đô Thị...)"
            className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* List of Genres */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredGenres.map((g) => {
              const isSelected = tempSelected.includes(g.name);
              return (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => handleToggleGenre(g.name)}
                  className={`p-2.5 rounded border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/70 text-sky-900 ring-1 ring-sky-500"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 text-zinc-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{g.name}</span>
                    {isSelected && (
                      <span className="text-[11px] text-sky-600 font-bold">✓</span>
                    )}
                  </div>
                  {g.description && (
                    <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1">
                      {g.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredGenres.length === 0 && (
            <p className="text-center text-xs text-zinc-400 py-8">
              Không tìm thấy thể loại nào phù hợp với từ khóa.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            {tempSelected.length === 0 ? "Chưa chọn thể loại nào" : `Đã chọn ${tempSelected.length} thể loại`}
          </span>
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
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
