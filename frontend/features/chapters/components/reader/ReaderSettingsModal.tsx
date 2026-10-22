import React from "react";
import { READER_THEMES, type ReaderThemeMode } from "./ReaderThemes";

interface ReaderSettingsModalProps {
  theme: ReaderThemeMode;
  onThemeChange: (theme: ReaderThemeMode) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  lineHeight: number;
  onLineHeightChange: (lh: number) => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
}) => {
  const t = READER_THEMES[theme];

  const getThemeOptionClass = (optTheme: ReaderThemeMode) => {
    if (theme === optTheme) {
      if (optTheme === "vintage") return "border-amber-700 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-700/40";
      if (optTheme === "light") return "border-zinc-900 bg-zinc-100 text-zinc-900 font-bold ring-2 ring-zinc-900/40";
      return "border-amber-400 bg-zinc-800 text-amber-300 font-bold ring-2 ring-amber-400/40";
    }
    if (theme === "dark") {
      return "border-zinc-700 text-zinc-400 bg-[#1e2026] hover:bg-[#252830] hover:text-zinc-200";
    }
    return "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100";
  };

  const getLineHeightOptionClass = (lh: number) => {
    if (lineHeight === lh) {
      if (theme === "dark") return "border-amber-400 bg-amber-400/15 text-amber-300 font-bold";
      if (theme === "light") return "border-zinc-900 bg-zinc-100 text-zinc-900 font-bold";
      return "border-[#8b251e] bg-amber-50 text-[#8b251e] font-bold";
    }
    if (theme === "dark") {
      return "border-zinc-700 text-zinc-400 bg-[#1e2026] hover:bg-[#252830] hover:text-zinc-200";
    }
    return "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100";
  };

  return (
    <div className={`absolute right-0 mt-2 w-72 rounded-2xl border p-4 z-50 animate-in fade-in zoom-in-95 duration-150 ${t.settingsPopup}`}>
      {/* 1. Chọn chế độ giao diện Theme */}
      <div className="mb-4">
        <label className={`text-xs font-bold block mb-2 uppercase tracking-wide ${t.settingsLabel}`}>
          Màu nền
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onThemeChange("vintage")}
            className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${getThemeOptionClass("vintage")}`}
          >
            <span className="w-4 h-4 rounded-full bg-[#fbf9f4] border border-stone-300 shadow-2xs" />
            <span>Mộc mạc</span>
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("light")}
            className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${getThemeOptionClass("light")}`}
          >
            <span className="w-4 h-4 rounded-full bg-white border border-zinc-300 shadow-2xs" />
            <span>Sáng</span>
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("dark")}
            className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${getThemeOptionClass("dark")}`}
          >
            <span className="w-4 h-4 rounded-full bg-[#202228] border border-zinc-600 shadow-2xs" />
            <span>Tối dịu mắt</span>
          </button>
        </div>
      </div>

      {/* 2. Cỡ chữ */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className={`text-xs font-bold uppercase tracking-wide ${t.settingsLabel}`}>
            Cỡ chữ: {fontSize}px
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFontSizeChange(fontSize - 1)}
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${t.settingsBtnSecondary}`}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onFontSizeChange(fontSize + 1)}
              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${t.settingsBtnSecondary}`}
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min="14"
          max="28"
          step="1"
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className={`w-full h-1.5 bg-stone-200 rounded-lg cursor-pointer ${t.rangeAccent}`}
        />
      </div>

      {/* 3. Giãn dòng */}
      <div>
        <label className={`text-xs font-bold block mb-2 uppercase tracking-wide ${t.settingsLabel}`}>
          Giãn dòng
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: "Gọn", val: 1.6 },
            { label: "Vừa", val: 1.8 },
            { label: "Thoáng", val: 2.2 },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => onLineHeightChange(item.val)}
              className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${getLineHeightOptionClass(item.val)}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
