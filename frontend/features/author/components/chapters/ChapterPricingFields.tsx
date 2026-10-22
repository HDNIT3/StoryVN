import React from "react";

interface ChapterPricingFieldsProps {
  isFree: boolean;
  setIsFree: (isFree: boolean) => void;
  coinPrice: number;
  setCoinPrice: (price: number) => void;
  requirePrevious: boolean;
  setRequirePrevious: (require: boolean) => void;
  error?: string;
}

export function ChapterPricingFields({
  isFree,
  setIsFree,
  coinPrice,
  setCoinPrice,
  requirePrevious,
  setRequirePrevious,
  error,
}: ChapterPricingFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-5 space-y-4 shadow-2xs">
      <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Cấu hình giá bán chương
      </h3>

      {/* Free or Paid Switch */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIsFree(true);
            setCoinPrice(0);
          }}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
            isFree
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isFree ? "bg-emerald-500" : "bg-zinc-300"}`} />
          Miễn phí
        </button>

        <button
          type="button"
          onClick={() => {
            setIsFree(false);
            if (coinPrice <= 0) setCoinPrice(10);
          }}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
            !isFree
              ? "bg-amber-50 border-amber-300 text-amber-900 shadow-2xs"
              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${!isFree ? "bg-amber-500" : "bg-zinc-300"}`} />
          Thu phí (Xu)
        </button>
      </div>

      {!isFree && (
        <div className="space-y-4 pt-2 border-t border-zinc-100 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Giá mở khóa (Xu):
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min={1}
                max={10000}
                value={coinPrice || ""}
                onChange={(e) => setCoinPrice(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ví dụ: 10"
                className={`w-full bg-white border rounded-md px-3 py-1.5 text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500 transition-colors ${
                  error ? "border-rose-400 focus:border-rose-500" : "border-zinc-200 focus:border-sky-500"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600">
                Xu
              </span>
            </div>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requirePrevious}
              onChange={(e) => setRequirePrevious(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 cursor-pointer"
            />
            <span className="text-xs text-zinc-700">
              Yêu cầu độc giả phải mua theo thứ tự tuần tự (không được nhảy cóc)
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
