"use client";

import React from "react";
import { READER_THEMES, type ReaderThemeMode } from "./ReaderThemes";
import { TTS_SPEED_OPTIONS, type UseSpeechReaderResult } from "../../hooks/useSpeechReader";

interface ReaderTtsBarProps {
  theme: ReaderThemeMode;
  reader: UseSpeechReaderResult;
}

export const ReaderTtsBar: React.FC<ReaderTtsBarProps> = ({ theme, reader }) => {
  const t = READER_THEMES[theme];
  const { ready, status, currentIndex, totalChunks, speed, play, pause, stop, setSpeed } = reader;

  const isPlaying = status === "playing" || status === "loading";
  const isPaused = status === "paused";

  const optionClass = (active: boolean) => {
    if (active) {
      if (theme === "dark") return "border-amber-400 bg-amber-400/15 text-amber-300 font-bold";
      if (theme === "light") return "border-zinc-900 bg-zinc-100 text-zinc-900 font-bold";
      return "border-[#8b251e] bg-amber-50 text-[#8b251e] font-bold";
    }
    if (theme === "dark") {
      return "border-zinc-700 text-zinc-400 bg-[#1e2026] hover:bg-[#252830] hover:text-zinc-200";
    }
    return "border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100";
  };

  const primaryBtnClass =
    theme === "dark"
      ? "bg-amber-400 text-zinc-900 hover:bg-amber-300"
      : theme === "light"
        ? "bg-zinc-900 text-white hover:bg-black"
        : "bg-[#8b1e17] text-white hover:bg-[#721913]";

  const statusText = () => {
    if (!ready) return "Chương này chưa có nội dung để đọc";
    if (status === "done") return "Đã đọc hết chương";
    if (status === "loading") return "Đang tải giọng đọc...";
    return `Đoạn ${Math.min(currentIndex + 1, totalChunks)}/${totalChunks}`;
  };

  return (
    <div className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 z-50 shadow-xl ${t.settingsPopup}`}>
      <label className={`text-xs font-bold block mb-2 uppercase tracking-wide ${t.settingsLabel}`}>
        Tốc độ đọc
      </label>

      <div className="grid grid-cols-5 gap-1.5 text-xs mb-4">
        {TTS_SPEED_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${optionClass(speed === value)}`}
          >
            x{value}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            type="button"
            onClick={pause}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${primaryBtnClass}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5h3v14H8zM13 5h3v14h-3z" />
            </svg>
            Tạm dừng
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={!ready}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtnClass}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isPaused ? "Tiếp tục" : status === "done" ? "Đọc lại" : "Đọc truyện"}
          </button>
        )}

        {(isPlaying || isPaused) && (
          <button
            type="button"
            onClick={stop}
            title="Dừng"
            className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${t.settingsBtn}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        )}
      </div>

      <p className={`text-[11px] mt-3 text-center ${t.secondaryText}`}>{statusText()}</p>
      <p className={`text-[10px] mt-1 text-center opacity-70 ${t.secondaryText}`}>
        Giọng đọc tiếng Việt miễn phí — cần kết nối Internet
      </p>
    </div>
  );
};
